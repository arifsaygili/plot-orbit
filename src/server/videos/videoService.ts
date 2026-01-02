import { prisma } from "@/lib/prisma";
import type { VideoStatus, FileType } from "@prisma/client";
import { randomUUID } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

/**
 * Get video by ID with tenant check
 */
export async function getVideo(videoId: string, tenantId: string) {
  const video = await prisma.video.findFirst({
    where: {
      id: videoId,
      tenantId,
    },
    include: {
      outputFile: true,
      sourceKml: true,
    },
  });

  return video;
}

/**
 * Update video status
 */
export async function updateVideoStatus(
  videoId: string,
  tenantId: string,
  status: VideoStatus,
  metadata?: {
    durationMs?: number;
    fps?: number;
    width?: number;
    height?: number;
    errorMessage?: string;
  }
) {
  const video = await prisma.video.updateMany({
    where: {
      id: videoId,
      tenantId,
    },
    data: {
      status,
      ...metadata,
    },
  });

  return video.count > 0;
}

/**
 * Save video file and link to Video record
 */
export async function saveVideoFile(
  videoId: string,
  tenantId: string,
  userId: string,
  file: File,
  filename: string
): Promise<{ ok: boolean; fileId?: string; error?: string }> {
  // Validate video belongs to tenant
  const video = await prisma.video.findFirst({
    where: {
      id: videoId,
      tenantId,
    },
  });

  if (!video) {
    return { ok: false, error: "Video not found" };
  }

  // Validate video is in correct state
  if (!["RECORDED", "UPLOADING"].includes(video.status)) {
    return { ok: false, error: `Cannot upload in status: ${video.status}` };
  }

  try {
    // Update status to UPLOADING
    await prisma.video.update({
      where: { id: videoId },
      data: { status: "UPLOADING" },
    });

    // Determine file type
    const mime = file.type;
    let fileType: FileType = "VIDEO_WEBM";
    if (mime.includes("mp4")) {
      fileType = "VIDEO_MP4";
    }

    // Generate storage key
    const ext = fileType === "VIDEO_MP4" ? "mp4" : "webm";
    const uniqueId = randomUUID();
    const storageKey = `videos/${tenantId}/${videoId}_${uniqueId}.${ext}`;

    // Get file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Save to storage (direct file save for videos)
    const videoDir = path.join(UPLOADS_DIR, "videos", tenantId);
    await fs.mkdir(videoDir, { recursive: true });
    const filePath = path.join(UPLOADS_DIR, storageKey);
    await fs.writeFile(filePath, buffer);

    // Create File record
    const fileRecord = await prisma.file.create({
      data: {
        tenantId,
        createdByUserId: userId,
        type: fileType,
        name: filename,
        originalName: filename,
        mime,
        size: buffer.length,
        storageKey,
      },
    });

    // Update Video with output file
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "READY",
        outputFileId: fileRecord.id,
      },
    });

    return { ok: true, fileId: fileRecord.id };
  } catch (err) {
    console.error("[VideoService] Save error:", err);

    // Update status to FAILED
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Upload failed",
      },
    });

    return { ok: false, error: "Failed to save video" };
  }
}
