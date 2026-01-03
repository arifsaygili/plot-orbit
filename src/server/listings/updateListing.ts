/**
 * Update a listing
 */

import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/server/auth";
import type { UpdateListingInput, ParsedListing } from "./types";

export async function updateListing(
  auth: AuthContext,
  listingId: string,
  input: UpdateListingInput
): Promise<ParsedListing | null> {
  // Verify ownership
  const existing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      tenantId: auth.tenant.id,
    },
  });

  if (!existing) return null;

  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: {
      title: input.title ?? existing.title,
      description: input.description !== undefined ? input.description : existing.description,
      aiDescription: input.aiDescription !== undefined ? input.aiDescription : existing.aiDescription,
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
