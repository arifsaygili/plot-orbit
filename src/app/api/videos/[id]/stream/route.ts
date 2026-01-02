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
 * GET /api/videos/[id]/stream - Stream video for player
 * Supports Range requests for seeking
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
      { ok: false, code: "NOT_READY", message: "Video is not ready" },
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
  const fileSize = stats.size;

  // Check for Range header (for seeking support)
  const rangeHeader = request.headers.get("range");

  if (rangeHeader) {
    // Parse range header
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    // Create stream for range
    const stream = fs.createReadStream(filePath, { start, end });

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

    return new NextResponse(webStream, {
      status: 206,
      headers: {
        "Content-Type": video.outputFile.mime,
        "Content-Length": chunkSize.toString(),
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
      },
    });
  }

  // No range - return full file
  const stream = fs.createReadStream(filePath);

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

  return new NextResponse(webStream, {
    headers: {
      "Content-Type": video.outputFile.mime,
      "Content-Length": fileSize.toString(),
      "Accept-Ranges": "bytes",
    },
  });
}
