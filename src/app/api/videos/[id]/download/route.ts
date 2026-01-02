import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import { prisma } from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

/**
 * GET /api/videos/[id]/download - Download video file
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;

  // Get video with output file
  const video = await prisma.video.findFirst({
    where: {
      id,
      tenantId: auth.tenant.id,
    },
    include: {
      outputFile: true,
    },
  });

  if (!video) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", message: "Video not found" },
      { status: 404 }
    );
  }

  if (video.status !== "READY" || !video.outputFile) {
    return NextResponse.json(
      { ok: false, code: "NOT_READY", message: "Video is not ready for download" },
      { status: 409 }
    );
  }

  // Get file path
  const filePath = path.join(UPLOADS_DIR, video.outputFile.storageKey);

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return NextResponse.json(
      { ok: false, code: "FILE_NOT_FOUND", message: "Video file not found" },
      { status: 404 }
    );
  }

  // Get file stats
  const stats = fs.statSync(filePath);

  // Create readable stream
  const stream = fs.createReadStream(filePath);

  // Convert Node stream to Web ReadableStream
  const webStream = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      stream.on("end", () => {
        controller.close();
      });
      stream.on("error", (err) => {
        controller.error(err);
      });
    },
    cancel() {
      stream.destroy();
    },
  });

  // Determine filename
  const ext = video.outputFile.type === "VIDEO_MP4" ? "mp4" : "webm";
  const filename = `video-${video.id}.${ext}`;

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": video.outputFile.mime,
      "Content-Length": stats.size.toString(),
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
