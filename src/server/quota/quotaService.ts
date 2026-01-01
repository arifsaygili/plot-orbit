import { prisma } from "@/lib/prisma";
import type {
  CanCreateVideoResult,
  ConsumeVideoCreditResult,
  TenantPlanInfo,
} from "./types";

/**
 * Get tenant's active plan with usage info
 */
export async function getTenantPlan(
  tenantId: string
): Promise<TenantPlanInfo | null> {
  const tenantPlan = await prisma.tenantPlan.findFirst({
    where: { tenantId, isActive: true },
    include: { plan: true },
  });

  if (!tenantPlan) {
    return null;
  }

  const usage = await prisma.tenantUsage.findUnique({
    where: { tenantId },
  });

  const videosCreatedLifetime = usage?.videosCreatedLifetime ?? 0;
  const lifetimeVideoLimit = tenantPlan.plan.lifetimeVideoLimit;

  return {
    planCode: tenantPlan.plan.code,
    planName: tenantPlan.plan.name,
    lifetimeVideoLimit,
    videosCreatedLifetime,
    videosRemaining: Math.max(0, lifetimeVideoLimit - videosCreatedLifetime),
  };
}

/**
 * Check if tenant can create a video based on their quota
 */
export async function canCreateVideo(
  tenantId: string
): Promise<CanCreateVideoResult> {
  const tenantPlan = await prisma.tenantPlan.findFirst({
    where: { tenantId, isActive: true },
    include: { plan: true },
  });

  if (!tenantPlan) {
    return {
      ok: false,
      code: "PLAN_NOT_FOUND",
      message: "No active plan found for tenant.",
    };
  }

  const usage = await prisma.tenantUsage.findUnique({
    where: { tenantId },
  });

  if (!usage) {
    return {
      ok: false,
      code: "USAGE_NOT_FOUND",
      message: "Usage record not found for tenant.",
    };
  }

  const { lifetimeVideoLimit } = tenantPlan.plan;
  const { videosCreatedLifetime } = usage;

  if (videosCreatedLifetime >= lifetimeVideoLimit) {
    return {
      ok: false,
      code: "QUOTA_EXCEEDED",
      message: `Free plan only allows ${lifetimeVideoLimit} video.`,
    };
  }

  return { ok: true };
}

/**
 * Consume a video credit (increment usage counter)
 * Transaction-safe to prevent race conditions
 */
export async function consumeVideoCredit(
  tenantId: string
): Promise<ConsumeVideoCreditResult> {
  return prisma.$transaction(async (tx) => {
    // Get plan and usage with lock
    const tenantPlan = await tx.tenantPlan.findFirst({
      where: { tenantId, isActive: true },
      include: { plan: true },
    });

    if (!tenantPlan) {
      return {
        ok: false as const,
        code: "PLAN_NOT_FOUND" as const,
        message: "No active plan found for tenant.",
      };
    }

    const usage = await tx.tenantUsage.findUnique({
      where: { tenantId },
    });

    if (!usage) {
      return {
        ok: false as const,
        code: "USAGE_NOT_FOUND" as const,
        message: "Usage record not found for tenant.",
      };
    }

    const { lifetimeVideoLimit } = tenantPlan.plan;
    const { videosCreatedLifetime } = usage;

    // Check limit inside transaction to prevent race condition
    if (videosCreatedLifetime >= lifetimeVideoLimit) {
      return {
        ok: false as const,
        code: "QUOTA_EXCEEDED" as const,
        message: `Free plan only allows ${lifetimeVideoLimit} video.`,
      };
    }

    // Increment usage
    const updatedUsage = await tx.tenantUsage.update({
      where: { tenantId },
      data: { videosCreatedLifetime: { increment: 1 } },
    });

    return {
      ok: true as const,
      videosCreatedLifetime: updatedUsage.videosCreatedLifetime,
    };
  });
}
