import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import type { VideoStatus } from "@prisma/client";

const VALID_STATUSES: VideoStatus[] = [
  "CREATED",
  "RECORDING",
  "RECORDED",
  "UPLOADING",
  "READY",
  "FAILED",
];

/**
 * GET /api/videos - List videos for tenant
 */
export async function GET(request: NextRequest) {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  const { searchParams } = new URL(request.url);

  // Parse query params
  const statusParam = searchParams.get("status");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

  // Build where clause
  const where: {
    tenantId: string;
    status?: VideoStatus;
  } = {
    tenantId: auth.tenant.id,
  };

  if (statusParam && VALID_STATUSES.includes(statusParam as VideoStatus)) {
    where.status = statusParam as VideoStatus;
  }

  // Get total count
  const total = await prisma.video.count({ where });

  // Get videos with pagination
  const videos = await prisma.video.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    include: {
      outputFile: {
        select: {
          id: true,
          type: true,
          mime: true,
          size: true,
        },
      },
      sourceKml: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    items: videos.map((video) => ({
      id: video.id,
      status: video.status,
      durationMs: video.durationMs,
      fps: video.fps,
      width: video.width,
      height: video.height,
      createdAt: video.createdAt.toISOString(),
      output: video.outputFile
        ? {
            fileId: video.outputFile.id,
            type: video.outputFile.type,
            mime: video.outputFile.mime,
            size: video.outputFile.size,
          }
        : null,
      sourceKml: video.sourceKml
        ? {
            id: video.sourceKml.id,
            name: video.sourceKml.name,
          }
        : null,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}
