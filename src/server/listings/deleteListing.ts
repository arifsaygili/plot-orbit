/**
 * Delete a listing
 */

import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/server/auth";

export async function deleteListing(
  auth: AuthContext,
  listingId: string
): Promise<boolean> {
  // Verify ownership
  const existing = await prisma.listing.findFirst({
    where: {
      id: listingId,
      tenantId: auth.tenant.id,
    },
  });

  if (!existing) return false;

  // Delete listing (videos will have listingId set to null due to onDelete: SetNull)
  await prisma.listing.delete({
    where: { id: listingId },
  });

  return true;
}
