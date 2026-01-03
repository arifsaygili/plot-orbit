import type {
  Entity,
  Cartesian3,
  KmlDataSource,
  PolygonGraphics,
  PolygonHierarchy,
  PolylineGraphics,
} from "cesium";

export interface BoundingInfo {
  center: { longitude: number; latitude: number; height: number };
  bbox: { west: number; south: number; east: number; north: number };
  radius: number; // Suggested orbit radius in meters
}

export interface EntityInfo {
  id: string;
  name: string;
  type: "polygon" | "polyline" | "point" | "other";
  area?: number; // Approximate area for polygons
}

/**
 * Extract all entities from a KML data source with their info
 */
export function getEntitiesInfo(
  dataSource: KmlDataSource,
  Cesium: typeof import("cesium")
): EntityInfo[] {
  const entities = dataSource.entities.values;
  const result: EntityInfo[] = [];

  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    const info = getEntityInfo(entity, Cesium, i);
    if (info) {
      result.push(info);
    }
  }

  // Sort by area (largest first) for polygons
  return result.sort((a, b) => (b.area ?? 0) - (a.area ?? 0));
}

function getEntityInfo(
  entity: Entity,
  Cesium: typeof import("cesium"),
  index: number
): EntityInfo | null {
  const name = entity.name || `Entity #${index + 1}`;
  const id = entity.id;

  if (entity.polygon) {
    const area = estimatePolygonArea(entity.polygon, Cesium);
    return { id, name, type: "polygon", area };
  }

  if (entity.polyline) {
    return { id, name, type: "polyline" };
  }

  if (entity.position) {
    return { id, name, type: "point" };
  }

  // Skip entities without geometry
  return null;
}

function estimatePolygonArea(
  polygon: PolygonGraphics,
  Cesium: typeof import("cesium")
): number {
  try {
    const hierarchy = polygon.hierarchy?.getValue(Cesium.JulianDate.now()) as PolygonHierarchy | undefined;
    if (!hierarchy?.positions || hierarchy.positions.length < 3) {
      return 0;
    }

    // Simple bounding box area estimation
    const positions = hierarchy.positions;
    let minLon = Infinity,
      maxLon = -Infinity,
      minLat = Infinity,
      maxLat = -Infinity;

    for (const pos of positions) {
      const carto = Cesium.Cartographic.fromCartesian(pos);
      const lon = Cesium.Math.toDegrees(carto.longitude);
      const lat = Cesium.Math.toDegrees(carto.latitude);

      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    }

    // Approximate area in square degrees (rough estimate)
    return (maxLon - minLon) * (maxLat - minLat);
  } catch {
    return 0;
  }
}

/**
 * Calculate bounding info for a specific entity
 */
export function getEntityBoundingInfo(
  entity: Entity,
  Cesium: typeof import("cesium")
): BoundingInfo | null {
  const positions = extractPositions(entity, Cesium);
  if (positions.length === 0) {
    return null;
  }

  return calculateBoundingInfo(positions, Cesium);
}

/**
 * Calculate bounding info for entire data source
 */
export function getDataSourceBoundingInfo(
  dataSource: KmlDataSource,
  Cesium: typeof import("cesium")
): BoundingInfo | null {
  const allPositions: Cartesian3[] = [];

  for (const entity of dataSource.entities.values) {
    const positions = extractPositions(entity, Cesium);
    allPositions.push(...positions);
  }

  if (allPositions.length === 0) {
    return null;
  }

  return calculateBoundingInfo(allPositions, Cesium);
}

function extractPositions(
  entity: Entity,
  Cesium: typeof import("cesium")
): Cartesian3[] {
  const now = Cesium.JulianDate.now();
  const positions: Cartesian3[] = [];

  // Polygon positions
  if (entity.polygon?.hierarchy) {
    const hierarchy = entity.polygon.hierarchy.getValue(now) as PolygonHierarchy | undefined;
    if (hierarchy?.positions) {
      positions.push(...hierarchy.positions);
    }
  }

  // Polyline positions
  if (entity.polyline?.positions) {
    const polylinePositions = (entity.polyline as PolylineGraphics).positions?.getValue(now) as Cartesian3[] | undefined;
    if (polylinePositions) {
      positions.push(...polylinePositions);
    }
  }

  // Point position
  if (entity.position) {
    const pos = entity.position.getValue(now);
    if (pos) {
      positions.push(pos);
    }
  }

  return positions;
}

function calculateBoundingInfo(
  positions: Cartesian3[],
  Cesium: typeof import("cesium")
): BoundingInfo {
  let minLon = Infinity,
    maxLon = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  let sumLon = 0,
    sumLat = 0,
    sumHeight = 0;

  for (const pos of positions) {
    const carto = Cesium.Cartographic.fromCartesian(pos);
    const lon = Cesium.Math.toDegrees(carto.longitude);
    const lat = Cesium.Math.toDegrees(carto.latitude);

    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);

    sumLon += lon;
    sumLat += lat;
    sumHeight += carto.height;
  }

  const count = positions.length;
  const centerLon = sumLon / count;
  const centerLat = sumLat / count;
  const centerHeight = sumHeight / count;

  // Default suggested orbit radius is 100m
  const suggestedRadius = 100;

  return {
    center: {
      longitude: centerLon,
      latitude: centerLat,
      height: centerHeight,
    },
    bbox: {
      west: minLon,
      south: minLat,
      east: maxLon,
      north: maxLat,
    },
    radius: suggestedRadius,
  };
}
