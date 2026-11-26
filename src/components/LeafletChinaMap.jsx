import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import geoData from "../../china-provinces.json";
import { cityCoordinates, origin } from "../data/students";
import { countBy } from "../lib/data";
import { groupStudentsByCampus } from "../lib/profiles";
import { colorForProvince } from "../lib/theme";
import { avatarPresets } from "./Avatar";
import { ChevronRightIcon, LocateIcon, MinusIcon, PlusIcon } from "./Icons";

const CHINA_BOUNDS = L.latLngBounds([18, 73], [54, 135]);
const DEFAULT_CENTER = [34.6, 104.2];
const DEFAULT_ZOOM = 4;
const AUTO_COUNTRY_ZOOM = 4.25;
const AUTO_PROVINCE_ZOOM = 5.25;
const AUTO_CITY_ZOOM = 9.25;
const AUTO_CITY_EXIT_ZOOM = 8.25;

function normalizeProvinceName(name) {
  return name
    .replace("特别行政区", "")
    .replace("维吾尔自治区", "")
    .replace("壮族自治区", "")
    .replace("回族自治区", "")
    .replace("自治区", "")
    .replace("省", "")
    .replace("市", "");
}

function featureCenter(feature) {
  const center = feature.properties.center ?? feature.properties.centroid;
  return center ? [center[1], center[0]] : DEFAULT_CENTER;
}

function createPopupContent(group, onStudentOpen) {
  const root = document.createElement("div");
  root.className = "leaflet-school-popup";

  const title = document.createElement("strong");
  title.textContent = group.school;
  root.appendChild(title);

  const meta = document.createElement("span");
  meta.textContent = `${group.location.campus} · ${group.students.length} 位同学`;
  root.appendChild(meta);

  const people = document.createElement("div");
  people.className = "leaflet-school-people";
  group.students.forEach((student) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = student.name;
    button.addEventListener("click", () => onStudentOpen(student.id));
    people.appendChild(button);
  });
  root.appendChild(people);

  return root;
}

export default function LeafletChinaMap({
  filteredStudents,
  provinceStudents,
  selectedProvince,
  activeCity,
  selectedStudent,
  focusRequest,
  onProvinceSelect,
  onCitySelect,
  onAutoRegionChange,
  onStudentOpen,
  schoolOpenRequest,
  onZoomChange,
  onResetMapContext,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const provinceLayerRef = useRef(null);
  const provinceMarkerLayerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const cityLayerRef = useRef(null);
  const schoolLayerRef = useRef(null);
  const selectedStudentLayerRef = useRef(null);
  const schoolMarkersRef = useRef(new Map());
  const cityMarkersRef = useRef([]);
  const schoolGroupsRef = useRef([]);
  const cityEntriesRef = useRef([]);
  const mapContextRef = useRef({ selectedProvince: "全部", activeCity: null });
  const handlersRef = useRef({
    onProvinceSelect,
    onCitySelect,
    onAutoRegionChange,
    onStudentOpen,
    onResetMapContext,
  });
  const suppressNextFocusRef = useRef(false);
  const autoRegionRequestLockRef = useRef(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [compactMarkers, setCompactMarkers] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 820,
  );
  const resolvedCityCoordinates = useMemo(() => {
    const resolved = { ...cityCoordinates };
    const fallbackGroups = new Map();
    filteredStudents.forEach((student) => {
      if (resolved[student.city]) return;
      const group = fallbackGroups.get(student.city) ?? [];
      group.push(student.coordinates);
      fallbackGroups.set(student.city, group);
    });
    fallbackGroups.forEach((coordinates, city) => {
      resolved[city] = [
        coordinates.reduce((sum, point) => sum + point[1], 0) / coordinates.length,
        coordinates.reduce((sum, point) => sum + point[0], 0) / coordinates.length,
      ];
    });
    return resolved;
  }, [filteredStudents]);
  const resolvedCityCoordinatesRef = useRef(resolvedCityCoordinates);
  resolvedCityCoordinatesRef.current = resolvedCityCoordinates;
  const cityRegionIndex = useMemo(() => {
    const grouped = new Map();
    provinceStudents.forEach((student) => {
      const entry = grouped.get(student.city) ?? {
        city: student.city,
        province: student.province,
        points: [],
      };
      entry.points.push(student.coordinates);
      grouped.set(student.city, entry);
    });
    return new Map(
      [...grouped.entries()].map(([city, entry]) => {
        const staticCoordinates = cityCoordinates[city];
        const coordinates = staticCoordinates
          ? [staticCoordinates[1], staticCoordinates[0]]
          : [
              entry.points.reduce((sum, point) => sum + point[0], 0) /
                entry.points.length,
              entry.points.reduce((sum, point) => sum + point[1], 0) /
                entry.points.length,
            ];
        return [city, { city, province: entry.province, coordinates }];
      }),
    );
  }, [provinceStudents]);
  const cityRegionIndexRef = useRef(cityRegionIndex);
  cityRegionIndexRef.current = cityRegionIndex;

  handlersRef.current = {
    onProvinceSelect,
    onCitySelect,
    onAutoRegionChange,
    onStudentOpen,
    onResetMapContext,
  };
  mapContextRef.current = { selectedProvince, activeCity };

  function provinceAtCenter(center) {
    let matchedProvince = null;
    let smallestSpan = Number.POSITIVE_INFINITY;
    let nearestProvince = null;
    provinceLayerRef.current?.eachLayer((layer) => {
      const province = layer.feature?.province;
      if (!province || !provinceCounts[province]) return;
      const bounds = layer.getBounds?.();
      if (!bounds) return;
      const boundsCenter = bounds.getCenter();
      const distance = boundsCenter.distanceTo(center);
      if (!nearestProvince || distance < nearestProvince.distance) {
        nearestProvince = { province, distance };
      }
      if (!bounds.contains(center)) return;
      const northEast = bounds.getNorthEast();
      const southWest = bounds.getSouthWest();
      const span =
        Math.abs(northEast.lat - southWest.lat) +
        Math.abs(northEast.lng - southWest.lng);
      if (span >= smallestSpan) return;
      smallestSpan = span;
      matchedProvince = province;
    });
    return matchedProvince ?? nearestProvince?.province ?? null;
  }

  function nearestCityToCenter(center, provinceName = "") {
    let nearest = null;
    cityRegionIndexRef.current.forEach((entry) => {
      if (
        provinceName &&
        provinceName !== "全部" &&
        entry.province !== provinceName
      ) {
        return;
      }
      const distance = L.latLng(
        entry.coordinates[0],
        entry.coordinates[1],
      ).distanceTo(center);
      if (!nearest || distance < nearest.distance) {
        nearest = { city: entry.city, distance };
      }
    });
    return nearest?.city ?? null;
  }

  function applyAutomaticMapLevel(map, nextZoom) {
    const context = mapContextRef.current;
    if (nextZoom <= AUTO_COUNTRY_ZOOM) {
      if (context.selectedProvince !== "全部" || context.activeCity) {
        if (autoRegionRequestLockRef.current) return;
        autoRegionRequestLockRef.current = true;
        suppressNextFocusRef.current = true;
        handlersRef.current.onAutoRegionChange?.({
          province: "全部",
          city: null,
        });
      }
      return;
    }
    if (nextZoom < AUTO_PROVINCE_ZOOM) return;

    const center = map.getCenter();
    const province =
      provinceAtCenter(center) ||
      (context.selectedProvince !== "全部"
        ? context.selectedProvince
        : null);
    if (!province) return;

    const shouldShowCity =
      nextZoom >= AUTO_CITY_ZOOM ||
      (Boolean(context.activeCity) && nextZoom >= AUTO_CITY_EXIT_ZOOM);
    const city = shouldShowCity
      ? nearestCityToCenter(center, province)
      : null;
    if (
      province !== context.selectedProvince ||
      city !== context.activeCity
    ) {
      if (autoRegionRequestLockRef.current) return;
      autoRegionRequestLockRef.current = true;
      suppressNextFocusRef.current = true;
      handlersRef.current.onAutoRegionChange?.({
        province,
        city,
      });
    }
  }

  const provinceCounts = useMemo(
    () => countBy(provinceStudents, "province"),
    [provinceStudents],
  );
  const cityCounts = useMemo(() => countBy(filteredStudents, "city"), [filteredStudents]);

  const provinceFeatures = useMemo(
    () =>
      geoData.features
        .map((feature) => ({
          ...feature,
          province: normalizeProvinceName(feature.properties.name),
        }))
        .filter((feature) => feature.province && feature.province !== "南海诸岛"),
    [],
  );

  const featureByProvince = useMemo(
    () => new Map(provinceFeatures.map((feature) => [feature.province, feature])),
    [provinceFeatures],
  );

  const cityEntries = useMemo(
    () =>
      Object.entries(cityCounts)
        .filter(([city]) => resolvedCityCoordinates[city])
        .sort(([cityA, countA], [cityB, countB]) => countB - countA || cityA.localeCompare(cityB, "zh-CN")),
    [cityCounts, resolvedCityCoordinates],
  );

  function clearSchoolMarkerOffsets() {
    schoolMarkersRef.current.forEach(({ marker }) => {
      const element = marker.getElement();
      if (!element) return;
      element.style.setProperty("--school-offset-x", "0px");
      element.style.setProperty("--school-offset-y", "0px");
      element.classList.remove("is-decluttered");
    });
  }

  function clearCityMarkerOffsets() {
    cityMarkersRef.current.forEach(({ element }) => {
      if (!element) return;
      element.style.setProperty("--city-offset-x", "0px");
      element.style.setProperty("--city-offset-y", "0px");
    });
  }

  function declutterCityMarkers() {
    const map = mapRef.current;
    if (!map || !cityMarkersRef.current.length) return;
    const mapContainer = map.getContainer();
    mapContainer.classList.add("is-decluttering");
    clearCityMarkerOffsets();
    mapContainer.getBoundingClientRect();
    const mapRect = mapContainer.getBoundingClientRect();
    const items = cityMarkersRef.current
      .filter(({ element }) => element)
      .map((item) => {
        const rect = item.element.getBoundingClientRect();
        return {
          ...item,
          width: rect.width,
          height: rect.height,
          point: {
            x: rect.left - mapRect.left + rect.width / 2,
            y: rect.top - mapRect.top + rect.height / 2,
          },
        };
      })
      .sort(
        (itemA, itemB) =>
          itemA.point.y - itemB.point.y || itemA.point.x - itemB.point.x,
      );
    const occupied = [];
    const edgePadding = 4;
    const collisionPadding = 3;
    items.forEach((item) => {
      const step = Math.max(item.width, item.height) + 7;
      let chosen = null;
      for (let ring = 0; ring <= 6 && !chosen; ring += 1) {
        const positions = ring === 0 ? 1 : ring * 8;
        for (let index = 0; index < positions; index += 1) {
          const angle =
            ring === 0 ? 0 : -Math.PI / 2 + (index * Math.PI * 2) / positions;
          const offsetX = Math.cos(angle) * step * ring;
          const offsetY = Math.sin(angle) * step * ring;
          const left = item.point.x + offsetX - item.width / 2;
          const top = item.point.y + offsetY - item.height / 2;
          const padded = {
            left: left - collisionPadding,
            top: top - collisionPadding,
            right: left + item.width + collisionPadding,
            bottom: top + item.height + collisionPadding,
          };
          if (
            padded.left < edgePadding ||
            padded.top < edgePadding ||
            padded.right > map.getSize().x - edgePadding ||
            padded.bottom > map.getSize().y - edgePadding
          ) {
            continue;
          }
          const overlaps = occupied.some(
            (rect) =>
              Math.min(rect.right, padded.right) > Math.max(rect.left, padded.left) &&
              Math.min(rect.bottom, padded.bottom) > Math.max(rect.top, padded.top),
          );
          if (!overlaps) {
            chosen = { offsetX, offsetY, rect: padded };
            break;
          }
        }
      }
      if (!chosen) {
        chosen = {
          offsetX: 0,
          offsetY: 0,
          rect: {
            left: item.point.x - item.width / 2,
            top: item.point.y - item.height / 2,
            right: item.point.x + item.width / 2,
            bottom: item.point.y + item.height / 2,
          },
        };
      }
      occupied.push(chosen.rect);
      item.element.style.setProperty("--city-offset-x", `${chosen.offsetX}px`);
      item.element.style.setProperty("--city-offset-y", `${chosen.offsetY}px`);
    });
    window.requestAnimationFrame(() => {
      mapContainer.classList.remove("is-decluttering");
    });
  }

  function declutterSchoolMarkers() {
    const map = mapRef.current;
    if (!map) return;

    const mapContainer = map.getContainer();
    mapContainer.classList.add("is-decluttering");
    clearSchoolMarkerOffsets();
    mapContainer.getBoundingClientRect();
    const mapRect = mapContainer.getBoundingClientRect();
    const items = [...schoolMarkersRef.current.values()]
      .map((item) => {
        const element = item.marker.getElement();
        const bubble = element?.querySelector(".leaflet-school-bubble");
        if (!element || !bubble) return null;
        const bubbleRect = bubble.getBoundingClientRect();
        return {
          ...item,
          element,
          bubble,
          point: {
            x: bubbleRect.left - mapRect.left + bubbleRect.width / 2,
            y: bubbleRect.top - mapRect.top + bubbleRect.height / 2,
          },
        };
      })
      .filter(Boolean)
      .sort(
        (itemA, itemB) =>
          itemA.point.y - itemB.point.y ||
          itemA.point.x - itemB.point.x ||
          itemA.group.school.localeCompare(itemB.group.school, "zh-CN"),
      );
    const mapSize = map.getSize();
    const occupied = [];
    const edgePadding = 4;
    const collisionPadding = 2;

    items.forEach((item) => {
      const { element, bubble } = item;
      const width = bubble.offsetWidth || 18;
      const height = bubble.offsetHeight || 18;
      const step = Math.max(width, height) + 8;
      let chosen = null;

      for (let ring = 0; ring <= 7 && !chosen; ring += 1) {
        const positions = ring === 0 ? 1 : ring * 8;
        for (let index = 0; index < positions; index += 1) {
          const angle = ring === 0 ? 0 : -Math.PI / 2 + (index * Math.PI * 2) / positions;
          const offsetX = Math.cos(angle) * step * ring;
          const offsetY = Math.sin(angle) * step * ring;
          const left = item.point.x + offsetX - width / 2;
          const top = item.point.y + offsetY - height / 2;
          const right = left + width;
          const bottom = top + height;
          if (
            left < edgePadding ||
            top < edgePadding ||
            right > mapSize.x - edgePadding ||
            bottom > mapSize.y - edgePadding
          ) {
            continue;
          }
          const padded = {
            left: left - collisionPadding,
            top: top - collisionPadding,
            right: right + collisionPadding,
            bottom: bottom + collisionPadding,
          };
          const overlaps = occupied.some(
            (rect) =>
              Math.min(rect.right, padded.right) > Math.max(rect.left, padded.left) &&
              Math.min(rect.bottom, padded.bottom) > Math.max(rect.top, padded.top),
          );
          if (!overlaps) {
            chosen = { offsetX, offsetY, rect: padded };
            break;
          }
        }
      }

      if (!chosen) {
        chosen = {
          offsetX: 0,
          offsetY: 0,
          rect: {
            left: item.point.x - width / 2,
            top: item.point.y - height / 2,
            right: item.point.x + width / 2,
            bottom: item.point.y + height / 2,
          },
        };
      }

      occupied.push(chosen.rect);
      element.style.setProperty("--school-offset-x", `${chosen.offsetX}px`);
      element.style.setProperty("--school-offset-y", `${chosen.offsetY}px`);
      if (chosen.offsetX || chosen.offsetY) {
        element.classList.add("is-decluttered");
      }
    });
    window.requestAnimationFrame(() => {
      mapContainer.classList.remove("is-decluttering");
    });
  }

  const schoolGroups = useMemo(() => {
    if (!activeCity) return [];
    return groupStudentsByCampus(filteredStudents, activeCity).sort(
      (groupA, groupB) =>
        groupA.school.localeCompare(groupB.school, "zh-CN") ||
        groupA.location.campus.localeCompare(groupB.location.campus, "zh-CN"),
    );
  }, [activeCity, filteredStudents]);

  schoolGroupsRef.current = schoolGroups;
  cityEntriesRef.current = cityEntries;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 17,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 90,
    });
    mapRef.current = map;

    const tiles = L.tileLayer(
      "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
      {
        subdomains: ["1", "2", "3", "4"],
        maxZoom: 18,
        className: "graduation-map-tiles",
        crossOrigin: true,
      },
    );
    tiles.on("tileerror", () => setTilesFailed(true));
    tiles.on("load", () => setTilesFailed(false));
    tiles.addTo(map);
    tileLayerRef.current = tiles;

    map.fitBounds(CHINA_BOUNDS, { padding: [14, 14] });
    map.on("zoomend", () => {
      const nextZoom = map.getZoom();
      setZoom(nextZoom);
      onZoomChange?.(nextZoom);
      applyAutomaticMapLevel(map, nextZoom);
      window.requestAnimationFrame(() => {
        declutterCityMarkers();
        declutterSchoolMarkers();
      });
    });
    map.on("moveend", () => {
      applyAutomaticMapLevel(map, map.getZoom());
      window.requestAnimationFrame(() => {
        declutterCityMarkers();
        declutterSchoolMarkers();
      });
    });
    map.on("click", (event) => {
      const groups = schoolGroupsRef.current;
      const clickPoint = map.latLngToContainerPoint(event.latlng);
      const threshold = window.innerWidth <= 700 ? 30 : 22;
      if (!groups.length) {
        const context = mapContextRef.current;
        if (context.selectedProvince === "全部" || context.activeCity) return;
        let nearestCity = null;
        cityEntriesRef.current.forEach(([city]) => {
          const coordinates = resolvedCityCoordinatesRef.current[city];
          const point = map.latLngToContainerPoint([coordinates[1], coordinates[0]]);
          const distance = clickPoint.distanceTo(point);
          if (distance <= 28 && (!nearestCity || distance < nearestCity.distance)) {
            nearestCity = { city, distance };
          }
        });
        if (nearestCity) handlersRef.current.onCitySelect(nearestCity.city);
        return;
      }
      let nearest = null;

      groups.forEach((group) => {
        const point = map.latLngToContainerPoint([
          group.location.coordinates[0],
          group.location.coordinates[1],
        ]);
        const distance = clickPoint.distanceTo(point);
        if (distance <= threshold && (!nearest || distance < nearest.distance)) {
          nearest = { group, distance };
        }
      });

      if (!nearest) return;
      const item = schoolMarkersRef.current.get(nearest.group.groupKey);
      if (!item) return;
      if (item.group.students.length === 1) {
        handlersRef.current.onStudentOpen(item.group.students[0].id);
        return;
      }
      item.marker
        .bindPopup(
          createPopupContent(item.group, handlersRef.current.onStudentOpen),
          {
            maxWidth: 250,
            closeButton: true,
            offset: [0, -10],
            className: "map-school-leaflet-popup",
          },
        )
        .openPopup();
    });

    provinceLayerRef.current = L.geoJSON(
      {
        type: "FeatureCollection",
        features: provinceFeatures,
      },
      {
        style: (feature) => {
          const province = feature.province;
          const count = provinceCounts[province] ?? 0;
          return {
            color: count ? colorForProvince(province) : "#b9b4a8",
            weight: count ? 1.15 : 0.75,
            opacity: count ? 0.7 : 0.45,
            fillColor: count ? colorForProvince(province) : "#e8e5d9",
            fillOpacity: province === selectedProvince ? 0.45 : count ? 0.18 : 0.35,
          };
        },
        onEachFeature: (feature, layer) => {
          const province = feature.province;
          layer.on("click", (event) => {
            if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
            layer.closeTooltip();
            handlersRef.current.onProvinceSelect(province);
          });
          layer.bindTooltip(
            `${province}${provinceCounts[province] ? ` · ${provinceCounts[province]} 位同学` : ""}`,
            { sticky: true, className: "map-leaflet-tooltip" },
          );
        },
      },
    ).addTo(map);

    routeLayerRef.current = L.layerGroup().addTo(map);
    provinceMarkerLayerRef.current = L.layerGroup().addTo(map);
    cityLayerRef.current = L.layerGroup().addTo(map);
    schoolLayerRef.current = L.layerGroup().addTo(map);
    selectedStudentLayerRef.current = L.layerGroup().addTo(map);

    const updateMarkerDensity = () => {
      setCompactMarkers(map.getSize().x < 820);
    };
    updateMarkerDensity();

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
      updateMarkerDensity();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !provinceLayerRef.current) return;
    provinceLayerRef.current.eachLayer((layer) => {
      const province = layer.feature.province;
      const count = provinceCounts[province] ?? 0;
      const element = layer.getElement();
      if (!element) return;
      element.dataset.province = province;
      element.setAttribute("role", "button");
      element.setAttribute("tabindex", "0");
      element.setAttribute(
        "aria-label",
        `${province}${count ? `，${count} 位同学` : ""}，点击查看城市`,
      );
      element.onkeydown = (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        handlersRef.current.onProvinceSelect(province);
      };
    });
    provinceLayerRef.current.setStyle((feature) => {
      const province = feature.province;
      const count = provinceCounts[province] ?? 0;
      const selected = province === selectedProvince;
      return {
        color: selected ? "#405f55" : count ? colorForProvince(province) : "#b9b4a8",
        weight: activeCity ? 0.75 : selected ? 2.1 : count ? 1.15 : 0.75,
        opacity: activeCity ? 0.28 : selected ? 0.95 : count ? 0.7 : 0.45,
        fillColor: count ? colorForProvince(province) : "#e8e5d9",
        fillOpacity: activeCity ? 0.015 : selected ? 0.36 : count ? 0.15 : 0.3,
      };
    });
  }, [activeCity, provinceCounts, selectedProvince]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (focusRequest?.mode === "school") {
      autoRegionRequestLockRef.current = false;
      suppressNextFocusRef.current = false;
      const coordinates = focusRequest.coordinates;
      if (coordinates) {
        map.flyTo([coordinates[0], coordinates[1]], 16, {
          duration: 0.65,
        });
      }
      return;
    }
    if (suppressNextFocusRef.current) {
      autoRegionRequestLockRef.current = false;
      suppressNextFocusRef.current = false;
      return;
    }
    if (activeCity && schoolGroups.length) {
      const bounds = L.latLngBounds(
        schoolGroups.map((group) => [
          group.location.coordinates[0],
          group.location.coordinates[1],
        ]),
      );
      map.flyToBounds(bounds, {
        padding: [48, 64],
        maxZoom: 14,
        duration: 0.65,
      });
      return;
    }
    if (selectedProvince === "全部") {
      map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.55 });
      return;
    }
    const feature = featureByProvince.get(selectedProvince);
    if (!feature) return;
    const bounds = L.geoJSON(feature).getBounds();
    map.flyToBounds(bounds, {
      padding: [32, 32],
      maxZoom: selectedProvince === "江苏" ? 7.5 : 9,
      duration: 0.65,
    });
  }, [activeCity, featureByProvince, focusRequest, schoolGroups, selectedProvince]);

  useEffect(() => {
    const map = mapRef.current;
    const routeLayer = routeLayerRef.current;
    if (!map || !routeLayer) return;
    routeLayer.clearLayers();
    if (selectedProvince !== "全部") return;

    provinceFeatures.forEach((feature) => {
      const province = feature.province;
      if (province === "江苏" || !provinceCounts[province]) return;
      const target = featureCenter(feature);
      L.polyline([origin.coordinates.slice().reverse(), target], {
        color: colorForProvince(province),
        weight: 1.15,
        opacity: 0.55,
        dashArray: "5 6",
        interactive: false,
      }).addTo(routeLayer);
    });
  }, [provinceCounts, provinceFeatures, selectedProvince]);

  useEffect(() => {
    const map = mapRef.current;
    const provinceLayer = provinceLayerRef.current;
    if (!map || !provinceLayer) return;
    provinceLayer.eachLayer((layer) => {
      layer.closeTooltip();
      layer.unbindTooltip();
      const province = layer.feature.province;
      const count = provinceCounts[province] ?? 0;
      if (selectedProvince !== "全部" || activeCity) return;
      layer.bindTooltip(
        count ? `${province} · ${count} 位同学` : province,
        { sticky: true, className: "map-leaflet-tooltip" },
      );
    });
  }, [activeCity, provinceCounts, selectedProvince]);

  useEffect(() => {
    const layer = provinceMarkerLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (selectedProvince !== "全部" || activeCity) return;

    provinceFeatures.forEach((feature) => {
      const province = feature.province;
      const count = provinceCounts[province] ?? 0;
      if (!count) return;
      const icon = L.divIcon({
        className: `leaflet-province-count ${count === 1 ? "is-single" : ""}`,
        html: count > 1 ? `<b>${count}</b>` : "",
        iconSize: count === 1 ? [10, 10] : [30, 30],
        iconAnchor: count === 1 ? [5, 5] : [15, 15],
      });
      const marker = L.marker(featureCenter(feature), { icon, keyboard: true })
        .addTo(layer)
        .bindTooltip(`${province} · ${count} 位同学`, {
          direction: "top",
          offset: [0, -10],
          className: "map-leaflet-tooltip",
        })
        .on("click", (event) => {
          if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
          marker.closeTooltip();
          handlersRef.current.onProvinceSelect(province);
        });
      const element = marker.getElement();
      if (element) {
        element.setAttribute("role", "button");
        element.setAttribute("aria-label", `${province}，${count} 位同学`);
      }
    });
  }, [activeCity, provinceCounts, provinceFeatures, selectedProvince]);

  useEffect(() => {
    const map = mapRef.current;
    const cityLayer = cityLayerRef.current;
    if (!map || !cityLayer) return;
    cityLayer.clearLayers();
    cityMarkersRef.current = [];
    if (selectedProvince === "全部" || activeCity) return;

    cityEntries.forEach(([city, count]) => {
      const icon = L.divIcon({
        className: `leaflet-city-marker ${compactMarkers ? "is-compact" : ""}`,
        html: compactMarkers
          ? `<span class="leaflet-city-dot"></span>`
          : `<span class="leaflet-city-dot"></span><b>${city}</b><em>${count}</em>`,
        iconSize: compactMarkers ? [12, 12] : [96, 28],
        iconAnchor: compactMarkers ? [6, 6] : [8, 14],
      });
      const coordinates = resolvedCityCoordinates[city];
      const marker = L.marker([coordinates[1], coordinates[0]], { icon, keyboard: true })
        .addTo(cityLayer)
        .bindTooltip(`${city} · ${count} 位同学`, {
          direction: "top",
          offset: [0, -10],
          className: "map-leaflet-tooltip",
        });
      marker.on("click", (event) => {
        if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
        marker.closeTooltip();
        handlersRef.current.onCitySelect(city);
      });
      const element = marker.getElement();
      if (element) {
        element.setAttribute("role", "button");
        element.setAttribute("aria-label", `${city}，${count} 位同学`);
        cityMarkersRef.current.push({ element, city });
      }
    });
    window.requestAnimationFrame(declutterCityMarkers);
  }, [
    activeCity,
    cityEntries,
    compactMarkers,
    resolvedCityCoordinates,
    selectedProvince,
  ]);

  useEffect(() => {
    if (selectedProvince === "全部" || activeCity) return undefined;
    const timers = [250, 650, 1000].map((delay) =>
      window.setTimeout(declutterCityMarkers, delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [activeCity, compactMarkers, selectedProvince]);

  useEffect(() => {
    const schoolLayer = schoolLayerRef.current;
    if (!schoolLayer) return;
    schoolLayer.clearLayers();
    schoolMarkersRef.current.clear();

    schoolGroups.forEach((group) => {
      const selected = group.students.some(
        (student) => student.id === selectedStudent?.id,
      );
      const icon = L.divIcon({
        className: `leaflet-school-marker-tile ${selected ? "is-selected" : ""}`,
        html: `
          <i class="leaflet-school-anchor" aria-hidden="true"></i>
          <span class="leaflet-school-bubble">${group.students.length}</span>
        `,
        iconSize: compactMarkers ? [18, 18] : [22, 22],
        iconAnchor: compactMarkers ? [9, 9] : [11, 11],
      });
      const marker = L.marker(
        [group.location.coordinates[0], group.location.coordinates[1]],
        { icon, keyboard: true, riseOnHover: true },
      )
        .addTo(schoolLayer)
        .bindTooltip(`${group.location.shortName} · ${group.students.length}`, {
          direction: "top",
          offset: [0, -10],
          className: "map-school-tooltip",
        });
      schoolMarkersRef.current.set(group.groupKey, { marker, group });
      const element = marker.getElement();
      if (element) {
        element.setAttribute("role", "button");
        element.setAttribute(
          "aria-label",
          `${group.school}，${group.location.campus}，${group.students.length} 位同学`,
        );
      }

      marker.on("click", (event) => {
        if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
        if (group.students.length === 1) {
          handlersRef.current.onStudentOpen(group.students[0].id);
          return;
        }
        marker
          .bindPopup(
            createPopupContent(group, handlersRef.current.onStudentOpen),
            {
              maxWidth: 250,
              closeButton: true,
              offset: [0, -10],
              className: "map-school-leaflet-popup",
            },
          )
          .openPopup();
      });

    });
    window.requestAnimationFrame(declutterSchoolMarkers);
  }, [compactMarkers, schoolGroups, selectedStudent?.school]);

  useEffect(() => {
    const layer = selectedStudentLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (
      activeCity ||
      !selectedStudent?.coordinates ||
      (selectedProvince !== "全部" &&
        selectedStudent.province !== selectedProvince)
    ) {
      return;
    }

    const compactAnchorX = 66;
    const avatarPreset = avatarPresets.find(
      (preset) => preset.id === selectedStudent.avatar,
    );
    const icon = L.divIcon({
      className: `leaflet-selected-student-pin ${
        compactMarkers ? "is-compact" : ""
      }`,
      html: compactMarkers
        ? `<span class="leaflet-selected-student-compact" style="background:${avatarPreset?.accent ?? "#4b7297"}">${selectedStudent.name.slice(-1)}</span>`
        : `
          <span class="leaflet-selected-student-card">
            <i class="leaflet-selected-student-avatar" style="background:${avatarPreset?.background ?? "#dbe5ea"};color:${avatarPreset?.ink ?? "#2e4b65"}">${selectedStudent.name.slice(-1)}</i>
            <b>${selectedStudent.name}</b>
            <small>${selectedStudent.campus}</small>
          </span>
        `,
      iconSize: compactMarkers ? [30, 30] : [210, 42],
      iconAnchor: compactMarkers ? [compactAnchorX, 27] : [105, 38],
    });
    const marker = L.marker(selectedStudent.coordinates, {
      icon,
      keyboard: true,
      zIndexOffset: 600,
    })
      .addTo(layer)
      .on("click", () => handlersRef.current.onStudentOpen(selectedStudent.id));
    marker.bindTooltip(
      `${selectedStudent.name} · ${selectedStudent.school} · ${selectedStudent.campus}`,
      {
        direction: "top",
        offset: [0, -36],
        className: "map-school-tooltip",
      },
    );
    const element = marker.getElement();
    if (element) {
      element.dataset.avatar = selectedStudent.avatar || "auto";
      element.setAttribute("role", "button");
      element.setAttribute(
        "aria-label",
        `${selectedStudent.name}，${selectedStudent.school}，${selectedStudent.campus}`,
      );
    }
  }, [
    activeCity,
    compactMarkers,
    selectedProvince,
    selectedStudent?.campus,
    selectedStudent?.avatar,
    selectedStudent?.coordinates,
    selectedStudent?.id,
    selectedStudent?.name,
    selectedStudent?.province,
    selectedStudent?.school,
    zoom,
  ]);

  useEffect(() => {
    if (!activeCity) return undefined;
    const declutterTimers = [300, 650, 950, 1250, 1600].map((delay) =>
      window.setTimeout(declutterSchoolMarkers, delay),
    );
    return () => {
      declutterTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [activeCity, compactMarkers]);

  useEffect(() => {
    if (!schoolOpenRequest) return;
    const item = schoolMarkersRef.current.get(schoolOpenRequest.groupKey);
    if (!item) return;
    if (item.group.students.length === 1) {
      onStudentOpen(item.group.students[0].id);
      return;
    }
    item.marker
      .bindPopup(
        createPopupContent(item.group, onStudentOpen),
        {
          maxWidth: 250,
          closeButton: true,
          offset: [0, -10],
          className: "map-school-leaflet-popup",
        },
      )
      .openPopup();
  }, [onStudentOpen, schoolOpenRequest]);

  function updateZoom(nextZoom) {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(nextZoom, { animate: true });
  }

  function focusSelectedSchool() {
    if (!selectedStudent?.coordinates) return;
    mapRef.current?.flyTo(
      selectedStudent.coordinates,
      16,
      { duration: 0.55 },
    );
  }

  function returnToCountry() {
    mapRef.current?.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.55 });
    onResetMapContext?.();
  }

  return (
    <div
      className={[
        "leaflet-map-shell",
        activeCity ? "is-school-view" : "",
        zoom >= 10 ? "is-deep-zoom" : "",
        compactMarkers ? "has-compact-markers" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div ref={containerRef} className="leaflet-map-canvas" />

      <nav className="leaflet-breadcrumbs" aria-label="地图层级">
        <button
          type="button"
          onClick={returnToCountry}
          aria-current={selectedProvince === "全部" ? "page" : undefined}
        >
          全国
        </button>
        {selectedProvince !== "全部" && (
          <>
            <ChevronRightIcon size={12} />
            <button
              type="button"
              onClick={() => onProvinceSelect(selectedProvince)}
              aria-current={!activeCity ? "page" : undefined}
            >
              {selectedProvince}
            </button>
          </>
        )}
        {activeCity && activeCity !== selectedProvince && (
          <>
            <ChevronRightIcon size={12} />
            <span>{activeCity}</span>
          </>
        )}
      </nav>

      <div className="leaflet-zoom-controls" aria-label="地图缩放控制">
        <button
          type="button"
          onClick={() => updateZoom(mapRef.current.getZoom() + 0.75)}
          aria-label="放大地图"
          disabled={zoom >= 17}
        >
          <PlusIcon size={18} />
        </button>
        <span>{zoom.toFixed(1)}×</span>
        <button
          type="button"
          onClick={() => updateZoom(mapRef.current.getZoom() - 0.75)}
          aria-label="缩小地图"
          disabled={zoom <= 3}
        >
          <MinusIcon size={18} />
        </button>
        <button
          type="button"
          onClick={focusSelectedSchool}
          aria-label="定位当前同学的院校"
          title="定位当前同学的院校"
        >
          <LocateIcon size={18} />
        </button>
      </div>

      <div className="leaflet-map-hint">
        {activeCity
          ? "小点为校区位置 · 点击数字查看同学"
          : selectedProvince !== "全部"
            ? "放大进入城市 · 缩小返回全国"
            : "放大地图自动进入省份"}
      </div>

      <div className="leaflet-attribution">地图 © 高德地图</div>

      {tilesFailed && (
        <div className="leaflet-tile-warning">底图加载失败，仍可使用院校点位。</div>
      )}
    </div>
  );
}
