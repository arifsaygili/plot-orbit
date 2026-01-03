/**
 * Parcel Layer utilities for Cesium
 * Handles loading GeoJSON parcels and camera positioning
 */

import type { Viewer, GeoJsonDataSource, Color } from "cesium";
import type { ParcelResult } from "@/client/api/parcelClient";

/** Styling options for parcel polygon */
export interface ParcelStyleOptions {
  fillColor?: { red: number; green: number; blue: number; alpha: number };
  strokeColor?: { red: number; green: number; blue: number; alpha: number };
  strokeWidth?: number;
}

const DEFAULT_STYLE: ParcelStyleOptions = {
  fillColor: { red: 1, green: 0.84, blue: 0, alpha: 0.4 }, // Gold/yellow
  strokeColor: { red: 1, green: 0.5, blue: 0, alpha: 1 }, // Orange
  strokeWidth: 3,
};

/**
 * Load parcel GeoJSON into Cesium viewer
 * @returns The created GeoJsonDataSource for cleanup
 */
export async function loadParcelLayer(
  Cesium: typeof import("cesium"),
  viewer: Viewer,
  parcel: ParcelResult,
  options: ParcelStyleOptions = {}
): Promise<GeoJsonDataSource> {
  const style = { ...DEFAULT_STYLE, ...options };

  // Create color objects
  const fillColor = new Cesium.Color(
    style.fillColor!.red,
    style.fillColor!.green,
    style.fillColor!.blue,
    style.fillColor!.alpha
  );

  const strokeColor = new Cesium.Color(
    style.strokeColor!.red,
    style.strokeColor!.green,
    style.strokeColor!.blue,
    style.strokeColor!.alpha
  );

  // Load GeoJSON
  const dataSource = await Cesium.GeoJsonDataSource.load(parcel.geojson, {
    stroke: strokeColor,
    fill: fillColor,
    strokeWidth: style.strokeWidth,
    clampToGround: true,
  });

  // Set data source name for identification
  dataSource.name = `parcel-${parcel.parcelId}`;

  // Add to viewer
  await viewer.dataSources.add(dataSource);

  // Apply additional styling to entities
  const entities = dataSource.entities.values;
  for (const entity of entities) {
    if (entity.polygon) {
      entity.polygon.material = new Cesium.ColorMaterialProperty(fillColor);
      entity.polygon.outline = new Cesium.ConstantProperty(true);
      entity.polygon.outlineColor = new Cesium.ConstantProperty(strokeColor);
      entity.polygon.outlineWidth = new Cesium.ConstantProperty(style.strokeWidth);
      entity.polygon.heightReference = new Cesium.ConstantProperty(Cesium.HeightReference.CLAMP_TO_GROUND);
    }
  }

  return dataSource;
}

/**
 * Remove all parcel layers from viewer
 */
export function clearParcelLayers(viewer: Viewer): void {
  const toRemove: GeoJsonDataSource[] = [];

  for (let i = 0; i < viewer.dataSources.length; i++) {
    const ds = viewer.dataSources.get(i);
    if (ds.name?.startsWith("parcel-")) {
      toRemove.push(ds as GeoJsonDataSource);
    }
  }

  for (const ds of toRemove) {
    viewer.dataSources.remove(ds, true);
  }
}

/**
 * Fly camera to parcel location
 */
export async function flyToParcel(
  Cesium: typeof import("cesium"),
  viewer: Viewer,
  parcel: ParcelResult,
  options?: {
    duration?: number;
    offset?: number; // Height offset in meters
  }
): Promise<void> {
  const [west, south, east, north] = parcel.bbox;
  const duration = options?.duration ?? 2.0;

  // Calculate center and appropriate height based on bbox size
  const centerLon = (west + east) / 2;
  const centerLat = (south + north) / 2;
  const width = east - west;
  const height = north - south;
  const maxExtent = Math.max(width, height);
  
  // Rough calculation: ~111km per degree at equator
  const extentMeters = maxExtent * 111000;
  const cameraHeight = Math.max(extentMeters * 2, 500) + (options?.offset ?? 0);

  // Fly to center point with calculated height
  await viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, cameraHeight),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-45),
      roll: 0,
    },
    duration,
  });
}

/**
 * Convenience function: load parcel and fly to it
 */
export async function showParcel(
  Cesium: typeof import("cesium"),
  viewer: Viewer,
  parcel: ParcelResult,
  options?: {
    clearPrevious?: boolean;
    style?: ParcelStyleOptions;
    flyDuration?: number;
  }
): Promise<GeoJsonDataSource> {
  // Clear previous parcels if requested
  if (options?.clearPrevious !== false) {
    clearParcelLayers(viewer);
  }

  // Load the parcel layer
  const dataSource = await loadParcelLayer(Cesium, viewer, parcel, options?.style);

  // Fly to the parcel
  await flyToParcel(Cesium, viewer, parcel, { duration: options?.flyDuration });

  return dataSource;
}
