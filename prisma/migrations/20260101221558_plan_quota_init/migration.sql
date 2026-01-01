-- CreateEnum
CREATE TYPE "PlanCode" AS ENUM ('FREE', 'PRO');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "code" "PlanCode" NOT NULL,
    "name" TEXT NOT NULL,
    "lifetimeVideoLimit" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantUsage" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "videosCreatedLifetime" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_code_key" ON "Plan"("code");

-- CreateIndex
CREATE INDEX "TenantPlan_tenantId_idx" ON "TenantPlan"("tenantId");

-- CreateIndex
CREATE INDEX "TenantPlan_isActive_idx" ON "TenantPlan"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TenantUsage_tenantId_key" ON "TenantUsage"("tenantId");

-- AddForeignKey
ALTER TABLE "TenantPlan" ADD CONSTRAINT "TenantPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantPlan" ADD CONSTRAINT "TenantPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantUsage" ADD CONSTRAINT "TenantUsage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
