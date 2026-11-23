import { students as baseStudents } from "../data/students.js";
import { builtInProfileOverrides } from "../data/default-profile-overrides.js";
import { findCampusPreset, getSchoolLocation } from "../data/school-locations.js";

export const PROFILE_STORAGE_KEY = "tianyi-graduation-profile-overrides-v1";

function normalizeText(value, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export function normalizeCoordinates(value) {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const latitude = Number(value[0]);
  const longitude = Number(value[1]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null;
  }
  return [latitude, longitude];
}

function toChinaCoordinates(firstValue, secondValue) {
  const first = Number(firstValue);
  const second = Number(secondValue);
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;
  if (first >= 3 && first <= 54 && second >= 73 && second <= 135) {
    return [first, second];
  }
  if (second >= 3 && second <= 54 && first >= 73 && first <= 135) {
    return [second, first];
  }
  return null;
}

export function parseMapCoordinates(input) {
  if (typeof input !== "string" || !input.trim()) return null;

  let text = input.trim();
  try {
    text = decodeURIComponent(text);
  } catch {
    // Keep the original text when a pasted URL contains an invalid escape.
  }

  const searchParams = (() => {
    try {
      const url = new URL(
        /^https?:\/\//i.test(text) ? text : `https://local.invalid/?${text.replace(/^\?/, "")}`,
      );
      return url.searchParams;
    } catch {
      return null;
    }
  })();

  if (searchParams) {
    const latitude =
      searchParams.get("lat") ??
      searchParams.get("latitude") ??
      searchParams.get("mlat");
    const longitude =
      searchParams.get("lng") ??
      searchParams.get("lon") ??
      searchParams.get("longitude") ??
      searchParams.get("mlon");
    const directCoordinates = toChinaCoordinates(latitude, longitude);
    if (directCoordinates) return directCoordinates;

    for (const key of ["ll", "center", "q", "query", "position", "location", "coords"]) {
      const pair = searchParams.get(key)?.match(
        /(-?\d{1,3}(?:\.\d+)?)\s*[,，]\s*(-?\d{1,3}(?:\.\d+)?)/,
      );
      const coordinates = pair ? toChinaCoordinates(pair[1], pair[2]) : null;
      if (coordinates) return coordinates;
    }
  }

  const pairPatterns = [
    /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/g,
    /(-?\d{1,3}(?:\.\d+)?)\s*[,，]\s*(-?\d{1,3}(?:\.\d+)?)/g,
  ];
  for (const pattern of pairPatterns) {
    for (const match of text.matchAll(pattern)) {
      const coordinates = toChinaCoordinates(match[1], match[2]);
      if (coordinates) return coordinates;
    }
  }

  return null;
}

function coordinatesDiffer(first, second) {
  if (!first || !second) return false;
  return (
    Math.abs(first[0] - second[0]) > 0.000001 ||
    Math.abs(first[1] - second[1]) > 0.000001
  );
}

function coordinatesDistanceMeters(first, second) {
  if (!first || !second) return 0;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(second[0] - first[0]);
  const longitudeDelta = toRadians(second[1] - first[1]);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(first[0])) *
      Math.cos(toRadians(second[0])) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function createStudentProfiles(overrides = {}) {
  return baseStudents.map((student) => {
    const location = getSchoolLocation(student.school);
    const override = overrides[student.id] ?? {};
    const overrideCoordinates = normalizeCoordinates(override.coordinates);
    const overrideCampus = normalizeText(override.campus);
    const campusPreset = findCampusPreset(student.school, overrideCampus);
    const schoolCoordinates = normalizeCoordinates(location?.coordinates);
    const shouldRepairCampusLocation =
      campusPreset &&
      overrideCoordinates &&
      coordinatesDistanceMeters(overrideCoordinates, campusPreset.coordinates) > 1500;
    const resolvedOverrideCoordinates = shouldRepairCampusLocation
      ? campusPreset.coordinates
      : overrideCoordinates;
    const coordinates = resolvedOverrideCoordinates ?? schoolCoordinates ?? [0, 0];
    const campus =
      campusPreset?.campus ||
      overrideCampus ||
      location?.campus ||
      "主要校区";
    const address =
      (shouldRepairCampusLocation ? campusPreset?.address : normalizeText(override.address)) ||
      campusPreset?.address ||
      location?.address ||
      "地址待补充";

    return {
      ...student,
      name: normalizeText(override.name) || student.name,
      major: normalizeText(override.major),
      city: campusPreset?.city || normalizeText(override.city) || student.city,
      province:
        campusPreset?.province || normalizeText(override.province) || student.province,
      campus,
      address,
      coordinates,
      notes: normalizeText(override.notes),
      defaultCampus: location?.campus ?? "主要校区",
      defaultAddress: location?.address ?? "地址待补充",
      defaultCoordinates: schoolCoordinates ?? coordinates,
      hasCustomLocation:
        Boolean(resolvedOverrideCoordinates && !schoolCoordinates) ||
        coordinatesDiffer(resolvedOverrideCoordinates, schoolCoordinates) ||
        campus !== (location?.campus ?? "主要校区") ||
        address !== (location?.address ?? "地址待补充"),
      hasCustomProfile: Boolean(override.updatedAt),
      profileUpdatedAt: override.updatedAt ?? "",
    };
  });
}

export function groupStudentsByCampus(studentList, city = null) {
  const grouped = new Map();

  studentList
    .filter((student) => !city || student.city === city)
    .forEach((student) => {
      const baseLocation = getSchoolLocation(student.school);
      const coordinates =
        normalizeCoordinates(student.coordinates) ??
        normalizeCoordinates(baseLocation?.coordinates);
      if (!coordinates) return;

      const campus = student.campus || baseLocation?.campus || "主要校区";
      const address = student.address || baseLocation?.address || "地址待补充";
      const groupKey = [
        student.school,
        campus,
        coordinates[0].toFixed(6),
        coordinates[1].toFixed(6),
      ].join("::");

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          groupKey,
          school: student.school,
          location: {
            ...(baseLocation ?? {}),
            campus,
            address,
            coordinates,
          },
          students: [],
        });
      }
      grouped.get(groupKey).students.push(student);
    });

  return [...grouped.values()];
}

export function loadProfileOverrides() {
  const defaults = structuredClone(builtInProfileOverrides);
  if (typeof window === "undefined") return defaults;
  try {
    const stored = JSON.parse(window.localStorage.getItem(PROFILE_STORAGE_KEY) ?? "{}");
    if (!stored || typeof stored !== "object" || Array.isArray(stored)) return defaults;
    const validStored = Object.fromEntries(
      Object.entries(stored).filter(
        ([id, override]) =>
          Number.isFinite(Number(id)) &&
          override &&
          typeof override === "object" &&
          !Array.isArray(override),
      ),
    );
    return { ...defaults, ...validStored };
  } catch {
    return defaults;
  }
}

export function saveProfileOverrides(overrides) {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(overrides));
    return true;
  } catch {
    return false;
  }
}
