/**
 * Client API for parcel query endpoints
 */

/** Administrative item (il, ilce, mahalle) */
export interface AdminItem {
  id: string;
  name: string;
}

/** GeoJSON types for parcel geometry */
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

/** Parcel query result */
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
  bbox: [number, number, number, number];
}

/** Response for admin list endpoints */
interface AdminListResponse {
  items: AdminItem[];
  count: number;
}

/** API error response */
interface ApiError {
  error: string;
  code?: string;
}

/**
 * Fetch list of provinces (il)
 */
export async function getIlList(): Promise<AdminItem[]> {
  const response = await fetch("/api/parcel/il");

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to fetch provinces");
  }

  const data: AdminListResponse = await response.json();
  return data.items;
}

/**
 * Fetch list of districts (ilce) for a province
 */
export async function getIlceList(ilId: string): Promise<AdminItem[]> {
  const response = await fetch(`/api/parcel/ilce?ilId=${encodeURIComponent(ilId)}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to fetch districts");
  }

  const data: AdminListResponse = await response.json();
  return data.items;
}

/**
 * Fetch list of neighborhoods (mahalle) for a district
 */
export async function getMahalleList(ilceId: string): Promise<AdminItem[]> {
  const response = await fetch(`/api/parcel/mahalle?ilceId=${encodeURIComponent(ilceId)}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to fetch neighborhoods");
  }

  const data: AdminListResponse = await response.json();
  return data.items;
}

/** Parcel query parameters */
export interface ParcelQueryParams {
  mahalleId: string;
  ada: string;
  parsel: string;
}

/**
 * Query a specific parcel
 */
export async function queryParcel(params: ParcelQueryParams): Promise<ParcelResult> {
  const { mahalleId, ada, parsel } = params;
  const queryString = new URLSearchParams({
    mahalleId,
    ada,
    parsel,
  }).toString();

  const response = await fetch(`/api/parcel/query?${queryString}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to query parcel");
  }

  return response.json();
}
