/**
 * Geometry utilities for parcel data
 */

type Coord = [number, number]; // [lng, lat]
type Ring = Coord[];
type PolygonCoords = Ring[]; // outer ring + optional holes
type MultiPolygonCoords = PolygonCoords[];

/**
 * Check if coordinates represent a MultiPolygon (4D array)
 */
export function isMultiPolygon(
  coords: number[][][] | number[][][][]
): coords is number[][][][] {
  if (!coords || coords.length === 0) return false;
  const first = coords[0];
  if (!first || first.length === 0) return false;
  // If first[0][0] is an array, it's MultiPolygon
  const inner = first[0];
  return Array.isArray(inner) && Array.isArray(inner[0]);
}

/**
 * Calculate bounding box from coordinates
 * Returns [west, south, east, north] (minLng, minLat, maxLng, maxLat)
 */
export function calculateBbox(
  coords: number[][][] | number[][][][]
): [number, number, number, number] {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  function processCoord(coord: Coord) {
    const [lng, lat] = coord;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  function processRing(ring: Ring) {
    for (const coord of ring) {
      processCoord(coord);
    }
  }

  function processPolygon(polygon: PolygonCoords) {
    for (const ring of polygon) {
      processRing(ring as Ring);
    }
  }

  if (isMultiPolygon(coords)) {
    for (const polygon of coords as MultiPolygonCoords) {
      processPolygon(polygon);
    }
  } else {
    processPolygon(coords as PolygonCoords);
  }

  // Fallback for invalid/empty geometries
  if (!isFinite(minLng)) {
    return [0, 0, 0, 0];
  }

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Calculate centroid (center point) from bounding box
 */
export function calculateCentroidFromBbox(
  bbox: [number, number, number, number]
): { lat: number; lng: number } {
  const [west, south, east, north] = bbox;
  return {
    lng: (west + east) / 2,
    lat: (south + north) / 2,
  };
}

/**
 * Calculate approximate centroid from polygon coordinates
 * Uses simple average of all coordinates
 */
export function calculateCentroid(
  coords: number[][][] | number[][][][]
): { lat: number; lng: number } {
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  function processCoord(coord: Coord) {
    sumLng += coord[0];
    sumLat += coord[1];
    count++;
  }

  function processRing(ring: Ring) {
    for (const coord of ring) {
      processCoord(coord);
    }
  }

  function processPolygon(polygon: PolygonCoords) {
    // Only process outer ring for centroid
    if (polygon[0]) {
      processRing(polygon[0] as Ring);
    }
  }

  if (isMultiPolygon(coords)) {
    for (const polygon of coords as MultiPolygonCoords) {
      processPolygon(polygon);
    }
  } else {
    processPolygon(coords as PolygonCoords);
  }

  if (count === 0) {
    return { lat: 0, lng: 0 };
  }

  return {
    lng: sumLng / count,
    lat: sumLat / count,
  };
}
