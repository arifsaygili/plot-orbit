/**
 * Listing types
 */

// Note: Prisma types will be available after running `npx prisma generate`
// import type { Listing, Video, User } from "@prisma/client";

/** Parcel information stored in Listing */
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

/** Centroid stored in Listing */
export interface Centroid {
  lat: number;
  lng: number;
}

/** Bounding box stored in Listing */
export type BBox = [number, number, number, number]; // [west, south, east, north]

/** GeoJSON geometry stored in Listing */
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

/** Input for creating a listing */
export interface CreateListingInput {
  title: string;
  description?: string;
  parcelInfo: ParcelInfo;
  geometry: ListingGeometry;
  centroid: Centroid;
  bbox: BBox;
}

/** Input for updating a listing */
export interface UpdateListingInput {
  title?: string;
  description?: string;
  aiDescription?: string;
}

/** Listing with video count */
export interface ListingWithVideoCount extends Listing {
  _count: {
    videos: number;
  };
}

/** Listing with full relations */
export interface ListingWithRelations extends Listing {
  createdBy: Pick<User, "id" | "name" | "email">;
  videos: Video[];
}

/** Parsed listing with typed JSON fields */
export interface ParsedListing {
  id: string;
  tenantId: string;
  createdByUserId: string;
  title: string;
  description: string | null;
  parcelInfo: ParcelInfo;
  geometry: ListingGeometry;
  centroid: Centroid;
  bbox: BBox;
  aiDescription: string | null;
  createdAt: Date;
  updatedAt: Date;
}
