/**
 * Normalize upstream parcel response to standard DTO
 */

import type {
  RawParselResponse,
  ParcelResult,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GeoJSONPolygon,
  GeoJSONMultiPolygon,
} from "./typesRaw";
import { calculateBbox, calculateCentroid, isMultiPolygon } from "./geo";

export interface NormalizeParams {
  mahalleId: string;
  ada: string;
  parsel: string;
}

/**
 * Normalize raw TKGM parcel response to ParcelResult DTO
 */
export function normalizeParcelResponse(
  raw: RawParselResponse,
  params: NormalizeParams
): ParcelResult {
  const { mahalleId, ada, parsel } = params;
  const coords = raw.geometry?.coordinates;

  if (!coords) {
    throw new Error("No geometry coordinates in response");
  }

  // Determine geometry type
  const isMulti = isMultiPolygon(coords);

  // Build GeoJSON Feature
  const feature: GeoJSONFeature<GeoJSONPolygon | GeoJSONMultiPolygon> = {
    type: "Feature",
    properties: {
      ada,
      parsel,
      mahalleId,
      il: raw.properties?.il,
      ilce: raw.properties?.ilce,
      mahalle: raw.properties?.mahalle,
      area: raw.properties?.alan || raw.properties?.mlesaha,
    },
    geometry: isMulti
      ? { type: "MultiPolygon", coordinates: coords as number[][][][] }
      : { type: "Polygon", coordinates: coords as number[][][] },
  };

  // Build FeatureCollection
  const geojson: GeoJSONFeatureCollection<GeoJSONPolygon | GeoJSONMultiPolygon> = {
    type: "FeatureCollection",
    features: [feature],
  };

  // Calculate bbox and centroid
  const bbox = calculateBbox(coords);
  const centroid = calculateCentroid(coords);

  // Build label
  const labelParts: string[] = [];
  if (raw.properties?.il) labelParts.push(raw.properties.il);
  if (raw.properties?.ilce) labelParts.push(raw.properties.ilce);
  if (raw.properties?.mahalle) labelParts.push(raw.properties.mahalle);
  labelParts.push(`Ada: ${ada}`);
  labelParts.push(`Parsel: ${parsel}`);
  const label = labelParts.join(" - ");

  // Generate parcel ID
  const parcelId = `${mahalleId}-${ada}-${parsel}`;

  return {
    parcelId,
    label,
    il: raw.properties?.il,
    ilce: raw.properties?.ilce,
    mahalle: raw.properties?.mahalle,
    ada,
    parsel,
    area: raw.properties?.alan || raw.properties?.mlesaha,
    geojson,
    centroid,
    bbox,
  };
}
