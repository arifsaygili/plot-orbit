/**
 * Get listings for a tenant
 */

import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/server/auth";
import type { ListingWithVideoCount } from "./types";

export interface GetListingsOptions {
  page?: number;
  limit?: number;
}

export interface GetListingsResult {
  items: ListingWithVideoCount[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getListings(
  auth: AuthContext,
  options: GetListingsOptions = {}
): Promise<GetListingsResult> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(50, Math.max(1, options.limit || 12));
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where: { tenantId: auth.tenant.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        _count: {
          select: { videos: true },
        },
      },
    }),
    prisma.listing.count({
      where: { tenantId: auth.tenant.id },
    }),
  ]);

  return {
    items: items as ListingWithVideoCount[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
