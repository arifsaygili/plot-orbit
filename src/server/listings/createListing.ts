/**
 * Create a new listing
 */

import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/server/auth";
import type { CreateListingInput, ParsedListing } from "./types";

export async function createListing(
  auth: AuthContext,
  input: CreateListingInput
): Promise<ParsedListing> {
  const listing = await prisma.listing.create({
    data: {
      tenantId: auth.tenant.id,
      createdByUserId: auth.user.id,
      title: input.title,
      description: input.description || null,
      parcelInfo: input.parcelInfo as object,
      geometry: input.geometry as object,
      centroid: input.centroid as object,
      bbox: input.bbox as unknown as object,
    },
  });

  return {
    ...listing,
    parcelInfo: listing.parcelInfo as unknown as ParsedListing["parcelInfo"],
    geometry: listing.geometry as unknown as ParsedListing["geometry"],
    centroid: listing.centroid as unknown as ParsedListing["centroid"],
    bbox: listing.bbox as unknown as ParsedListing["bbox"],
  };
}
