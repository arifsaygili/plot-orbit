import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import { getVideo } from "@/server/videos";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/videos/[id] - Get video details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;
  const video = await getVideo(id, auth.tenant.id);

  if (!video) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", message: "Video not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    video: {
      id: video.id,
      status: video.status,
      durationMs: video.durationMs,
      fps: video.fps,
      width: video.width,
      height: video.height,
      errorMessage: video.errorMessage,
      createdAt: video.createdAt.toISOString(),
      outputFile: video.outputFile
        ? {
            id: video.outputFile.id,
            name: video.outputFile.name,
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
    },
  });
}
