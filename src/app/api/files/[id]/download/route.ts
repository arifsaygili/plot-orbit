import { NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import { getFileById, getFileStream } from "@/server/files";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/files/:id/download - Download file (tenant-isolated)
export async function GET(request: Request, { params }: RouteParams) {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  try {
    const { id } = await params;

    // Get file with tenant check
    const file = await getFileById(id, auth.tenant.id);

    if (!file) {
      return NextResponse.json(
        { error: "File not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get file stream
    const stream = await getFileStream(file.storageKey);

    // Convert Node.js Readable to Web ReadableStream
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
    });

    // Return file as download
    return new Response(webStream, {
      headers: {
        "Content-Type": file.mime,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(file.originalName)}"`,
        "Content-Length": file.size.toString(),
      },
    });
  } catch (err) {
    console.error("File download error:", err);
    return NextResponse.json(
      { error: "Failed to download file", code: "DOWNLOAD_ERROR" },
      { status: 500 }
    );
  }
}
