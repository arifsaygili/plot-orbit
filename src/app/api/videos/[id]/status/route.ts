import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import { updateVideoStatus } from "@/server/videos";
import type { VideoStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES: VideoStatus[] = [
  "CREATED",
  "RECORDING",
  "RECORDED",
  "UPLOADING",
  "READY",
  "FAILED",
];

interface StatusUpdateBody {
  status: VideoStatus;
  durationMs?: number;
  fps?: number;
  width?: number;
  height?: number;
  errorMessage?: string;
}

/**
 * PATCH /api/videos/[id]/status - Update video status
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;

  let body: StatusUpdateBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_BODY", message: "Invalid request body" },
      { status: 400 }
    );
  }

  // Validate status
  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { ok: false, code: "INVALID_STATUS", message: "Invalid status value" },
      { status: 400 }
    );
  }

  const updated = await updateVideoStatus(id, auth.tenant.id, body.status, {
    durationMs: body.durationMs,
    fps: body.fps,
    width: body.width,
    height: body.height,
    errorMessage: body.errorMessage,
  });

  if (!updated) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", message: "Video not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true });
}
