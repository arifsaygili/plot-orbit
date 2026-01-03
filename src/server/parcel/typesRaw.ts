/**
 * Raw types from TKGM upstream APIs
 */

// GeoJSON type definitions
export interface GeoJSONPosition {
  0: number;
  1: number;
  2?: number;
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

export interface GeoJSONMultiPolygon {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

export interface GeoJSONFeature<G = GeoJSONPolygon | GeoJSONMultiPolygon> {
  type: "Feature";
  geometry: G;
  properties: Record<string, unknown> | null;
}

export interface GeoJSONFeatureCollection<G = GeoJSONPolygon | GeoJSONMultiPolygon> {
  type: "FeatureCollection";
  features: GeoJSONFeature<G>[];
}

/** Feature returned by il/ilce/mahalle list endpoints */
export interface RawAdminFeature {
  properties: {
    id: string | number;
    text: string;
  };
  geometry?: {
    coordinates: number[][][];
  };
}

/** Response from il/ilce/mahalle list endpoints */
export interface RawAdminListResponse {
  features: RawAdminFeature[];
}

/** Response from parsel query endpoint */
export interface RawParselResponse {
  geometry?: {
    coordinates: number[][][] | number[][][][]; // Polygon or MultiPolygon
  };
  properties?: {
    il?: string;
    ilce?: string;
    mahalle?: string;
    ada?: string | number;
    parsel?: string | number;
    alan?: number;
    mlesaha?: number;
  };
}

/** Normalized admin item for UI */
export interface AdminItem {
  id: string;
  name: string;
}

/** Normalized parcel result */
export interface ParcelResult {
  parcelId: string;
  label: string;
  il?: string;
  ilce?: string;
  mahalle?: string;
  ada: string;
  parsel: string;
  area?: number;
  geojson: GeoJSONFeatureCollection<GeoJSONPolygon | GeoJSONMultiPolygon>;
  centroid: { lat: number; lng: number };
  bbox: [number, number, number, number]; // [west, south, east, north]
}
