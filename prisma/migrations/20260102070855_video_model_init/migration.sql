-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('CREATED', 'RECORDING', 'RECORDED', 'UPLOADING', 'READY', 'FAILED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FileType" ADD VALUE 'VIDEO_WEBM';
ALTER TYPE "FileType" ADD VALUE 'VIDEO_MP4';

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "status" "VideoStatus" NOT NULL DEFAULT 'CREATED',
    "errorMessage" TEXT,
    "sourceKmlFileId" TEXT,
    "outputFileId" TEXT,
    "durationMs" INTEGER,
    "fps" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Video_tenantId_idx" ON "Video"("tenantId");

-- CreateIndex
CREATE INDEX "Video_tenantId_status_idx" ON "Video"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Video_createdByUserId_idx" ON "Video"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_sourceKmlFileId_fkey" FOREIGN KEY ("sourceKmlFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_outputFileId_fkey" FOREIGN KEY ("outputFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
