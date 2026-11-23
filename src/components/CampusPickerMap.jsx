import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { normalizeCoordinates } from "../lib/profiles";
import { LocateIcon } from "./Icons";

const FALLBACK_CENTER = [32.06, 118.79];

export default function CampusPickerMap({ coordinates, onChange, focusToken = 0 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [tilesFailed, setTilesFailed] = useState(false);
  const validCoordinates = normalizeCoordinates(coordinates);

  onChangeRef.current = onChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;

    const initial = normalizeCoordinates(coordinates) ?? FALLBACK_CENTER;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 18,
      zoomSnap: 0.5,
    }).setView(initial, 15);
    mapRef.current = map;

    const tiles = L.tileLayer(
      "https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
      {
        subdomains: ["1", "2", "3", "4"],
        maxZoom: 18,
        className: "graduation-map-tiles editor-map-tiles",
        crossOrigin: true,
      },
    );
    const tileWarningTimer = window.setTimeout(() => setTilesFailed(true), 8000);
    tiles.on("tileerror", () => setTilesFailed(true));
    tiles.on("load", () => {
      window.clearTimeout(tileWarningTimer);
      setTilesFailed(false);
    });
    tiles.addTo(map);

    const icon = L.divIcon({
      className: "campus-picker-marker",
      html: "<span></span><i></i>",
      iconSize: [34, 42],
      iconAnchor: [17, 40],
    });
    const marker = L.marker(initial, { icon, draggable: true, keyboard: true }).addTo(map);
    markerRef.current = marker;

    function updateFromMap(latlng) {
      const next = [
        Number(latlng.lat.toFixed(6)),
        Number(latlng.lng.toFixed(6)),
      ];
      marker.setLatLng(next);
      onChangeRef.current?.(next);
    }

    map.on("click", (event) => updateFromMap(event.latlng));
    marker.on("dragend", () => updateFromMap(marker.getLatLng()));

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });
    resizeObserver.observe(containerRef.current);
    const resizeTimer = window.setTimeout(() => map.invalidateSize({ pan: false }), 80);

    return () => {
      window.clearTimeout(resizeTimer);
      window.clearTimeout(tileWarningTimer);
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!validCoordinates || !mapRef.current || !markerRef.current) return;
    const latlng = L.latLng(validCoordinates[0], validCoordinates[1]);
    markerRef.current.setLatLng(latlng);
    if (!mapRef.current.getBounds().pad(-0.22).contains(latlng)) {
      mapRef.current.panTo(latlng, { animate: true });
    }
  }, [validCoordinates?.[0], validCoordinates?.[1]]);

  useEffect(() => {
    if (!focusToken || !validCoordinates || !mapRef.current) return;
    mapRef.current.flyTo(
      validCoordinates,
      Math.max(mapRef.current.getZoom(), 16),
      { duration: 0.45 },
    );
  }, [focusToken]);

  function locateCurrentPoint() {
    if (!validCoordinates || !mapRef.current) return;
    mapRef.current.flyTo(validCoordinates, 16, { duration: 0.5 });
  }

  return (
    <div className="campus-picker-shell">
      <div ref={containerRef} className="campus-picker-canvas" />
      <span className="campus-picker-badge">点击地图或拖动标记</span>
      <button
        type="button"
        className="campus-picker-locate"
        onClick={locateCurrentPoint}
        aria-label="定位到当前校区坐标"
        title="定位到当前校区坐标"
      >
        <LocateIcon size={17} />
      </button>
      <span className="campus-picker-attribution">底图 © 高德地图</span>
      {tilesFailed && <span className="campus-picker-warning">底图暂不可用</span>}
    </div>
  );
}
