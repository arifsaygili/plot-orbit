/**
 * Client API for listings endpoints
 */

/** Parcel information */
export interface ParcelInfo {
  il?: string;
  ilce?: string;
  mahalle?: string;
  ada: string;
  parsel: string;
  mahalleId?: string;
  alan?: number | string;
  mevkii?: string;
  nitelik?: string;
}

/** Centroid */
export interface Centroid {
  lat: number;
  lng: number;
}

/** Bounding box */
export type BBox = [number, number, number, number];

/** GeoJSON geometry */
export interface ListingGeometry {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: {
      type: "Polygon" | "MultiPolygon";
      coordinates: number[][][] | number[][][][];
    };
    properties: Record<string, unknown> | null;
  }>;
}

/** Listing item in list */
export interface ListingItem {
  id: string;
  title: string;
  description: string | null;
  parcelInfo: ParcelInfo;
  centroid: Centroid;
  bbox: BBox;
  aiDescription: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    videos: number;
  };
}

/** Full listing with relations */
export interface ListingDetail {
  id: string;
  title: string;
  description: string | null;
  parcelInfo: ParcelInfo;
  geometry: ListingGeometry;
  centroid: Centroid;
  bbox: BBox;
  aiDescription: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  };
  videos?: Array<{
    id: string;
    status: string;
    createdAt: string;
    durationMs: number | null;
  }>;
  _count?: {
    videos: number;
  };
}

/** Create listing input */
export interface CreateListingInput {
  title: string;
  description?: string;
  parcelInfo: ParcelInfo;
  geometry: ListingGeometry;
  centroid: Centroid;
  bbox: BBox;
}

/** Update listing input */
export interface UpdateListingInput {
  title?: string;
  description?: string;
}

/** List response */
interface ListingsResponse {
  items: ListingItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** API error */
interface ApiError {
  error: string;
  code?: string;
}

/**
 * Get listings list
 */
export async function getListings(page = 1, limit = 12): Promise<ListingsResponse> {
  const response = await fetch(`/api/listings?page=${page}&limit=${limit}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to fetch listings");
  }

  return response.json();
}

/**
 * Get a single listing
 */
export async function getListing(id: string): Promise<ListingDetail> {
  const response = await fetch(`/api/listings/${id}`);

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to fetch listing");
  }

  const data = await response.json();
  return data.listing;
}

/**
 * Create a new listing
 */
export async function createListing(input: CreateListingInput): Promise<ListingDetail> {
  const response = await fetch("/api/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to create listing");
  }

  const data = await response.json();
  return data.listing;
}

/**
 * Update a listing
 */
export async function updateListing(id: string, input: UpdateListingInput): Promise<ListingDetail> {
  const response = await fetch(`/api/listings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to update listing");
  }

  const data = await response.json();
  return data.listing;
}

/**
 * Delete a listing
 */
export async function deleteListing(id: string): Promise<void> {
  const response = await fetch(`/api/listings/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to delete listing");
  }
}

/**
 * Generate AI description for a listing
 */
export async function generateDescription(id: string): Promise<ListingDetail> {
  const response = await fetch(`/api/listings/${id}/generate-description`, {
    method: "POST",
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.error || "Failed to generate description");
  }

  const data = await response.json();
  return data.listing;
}

/** Namespace export for convenience */
export const listingsClient = {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  generateDescription,
};
