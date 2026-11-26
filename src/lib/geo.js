function pointOnSegment(point, start, end) {
  const epsilon = 1e-9;
  const lengthSquared =
    (end[0] - start[0]) ** 2 + (end[1] - start[1]) ** 2;
  if (lengthSquared <= epsilon) return false;
  const cross =
    (point.lng - start[0]) * (end[1] - start[1]) -
    (point.lat - start[1]) * (end[0] - start[0]);
  if (Math.abs(cross) > epsilon) return false;
  const dot =
    (point.lng - start[0]) * (end[0] - start[0]) +
    (point.lat - start[1]) * (end[1] - start[1]);
  if (dot < -epsilon) return false;
  return dot <= lengthSquared + epsilon;
}

function pointInRing(point, ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const start = ring[previous];
    const end = ring[index];
    if (pointOnSegment(point, start, end)) return true;
    const intersects =
      end[1] > point.lat !== start[1] > point.lat &&
      point.lng <
        ((start[0] - end[0]) * (point.lat - end[1])) /
          (start[1] - end[1]) +
          end[0];
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInPolygon(point, polygon) {
  if (!polygon?.length || !pointInRing(point, polygon[0])) return false;
  return !polygon.slice(1).some((hole) => pointInRing(point, hole));
}

export function featureContainsPoint(feature, point) {
  const geometry = feature?.geometry;
  if (!geometry) return false;
  if (geometry.type === "Polygon") {
    return pointInPolygon(point, geometry.coordinates);
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
  }
  return false;
}

export function findProvinceAtPoint(features, point, currentProvince = "") {
  const matches = features.filter((feature) =>
    featureContainsPoint(feature, point),
  );
  if (matches.some((feature) => feature.province === currentProvince)) {
    return currentProvince;
  }
  return matches[0]?.province ?? null;
}
