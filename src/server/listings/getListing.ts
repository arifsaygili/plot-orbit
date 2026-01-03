/**
 * Get a single listing by ID
 */

import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/server/auth";
import type { ListingWithRelations, ParsedListing } from "./types";

export interface GetListingResult extends ParsedListing {
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  videos: Array<{
    id: string;
    status: string;
    createdAt: Date;
    durationMs: number | null;
  }>;
}

export async function getListing(
  auth: AuthContext,
  listingId: string
): Promise<GetListingResult | null> {
  const listing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      tenantId: auth.tenant.id,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      videos: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          durationMs: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!listing) return null;

  return {
    ...listing,
    parcelInfo: listing.parcelInfo as unknown as ParsedListing["parcelInfo"],
    geometry: listing.geometry as unknown as ParsedListing["geometry"],
    centroid: listing.centroid as unknown as ParsedListing["centroid"],
    bbox: listing.bbox as unknown as ParsedListing["bbox"],
  };
}
