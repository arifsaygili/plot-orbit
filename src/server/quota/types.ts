export type QuotaErrorCode =
  | "QUOTA_EXCEEDED"
  | "PLAN_NOT_FOUND"
  | "USAGE_NOT_FOUND";

export type CanCreateVideoResult =
  | { ok: true }
  | { ok: false; code: QuotaErrorCode; message: string };

export type ConsumeVideoCreditResult =
  | { ok: true; videosCreatedLifetime: number }
  | { ok: false; code: QuotaErrorCode; message: string };

export interface TenantPlanInfo {
  planCode: string;
  planName: string;
  lifetimeVideoLimit: number;
  videosCreatedLifetime: number;
  videosRemaining: number;
}
