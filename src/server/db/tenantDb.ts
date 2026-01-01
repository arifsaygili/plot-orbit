import { prisma } from "@/lib/prisma";
import type { AuthContext } from "@/server/auth";

/**
 * Tenant-scoped database helper.
 * Provides methods that automatically filter by tenantId.
 *
 * IMPORTANT: Always use this helper for tenant-specific data access.
 * Never accept tenantId from request body - always use auth.tenant.id.
 */
export function createTenantDb(auth: AuthContext) {
  const tenantId = auth.tenant.id;

  return {
    tenantId,

    /**
     * Get the raw prisma client for complex queries.
     * Remember to always include tenantId in your WHERE clause.
     */
    get prisma() {
      return prisma;
    },

    /**
     * User operations scoped to current tenant
     */
    user: {
      findMany: () =>
        prisma.user.findMany({
          where: { tenantId },
        }),

      findById: (id: string) =>
        prisma.user.findFirst({
          where: { id, tenantId },
        }),

      count: () =>
        prisma.user.count({
          where: { tenantId },
        }),
    },

    /**
     * Session operations scoped to current tenant
     */
    session: {
      findMany: () =>
        prisma.session.findMany({
          where: { tenantId },
        }),

      deleteAllForUser: (userId: string) =>
        prisma.session.deleteMany({
          where: { userId, tenantId },
        }),
    },

    // Add more tenant-scoped operations as needed
    // Example for future tables:
    //
    // project: {
    //   findMany: () => prisma.project.findMany({ where: { tenantId } }),
    //   create: (data: Omit<ProjectCreateInput, 'tenantId'>) =>
    //     prisma.project.create({ data: { ...data, tenantId } }),
    // },
  };
}

export type TenantDb = ReturnType<typeof createTenantDb>;
