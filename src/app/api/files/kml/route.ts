import { NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import {
  createFile,
  listFiles,
  getFileTypeFromName,
  MAX_FILE_SIZE,
} from "@/server/files";
import { FileType } from "@prisma/client";

// POST /api/files/kml - Upload KML/KMZ file
export async function POST(request: Request) {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const customName = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided", code: "NO_FILE" },
        { status: 400 }
      );
    }

    // Validate file type by extension
    const fileType = getFileTypeFromName(file.name);
    if (!fileType) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only .kml and .kmz files are allowed.",
          code: "INVALID_FILE_TYPE",
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`,
          code: "FILE_TOO_LARGE",
        },
        { status: 413 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine MIME type
    const mime =
      fileType === "KMZ"
        ? "application/vnd.google-earth.kmz"
        : "application/vnd.google-earth.kml+xml";

    // Create file record
    const createdFile = await createFile({
      tenantId: auth.tenant.id,
      userId: auth.user.id,
      buffer,
      originalName: file.name,
      name: customName || undefined,
      type: FileType[fileType],
      mime,
    });

    return NextResponse.json({ file: createdFile }, { status: 201 });
  } catch (err) {
    console.error("File upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload file", code: "UPLOAD_ERROR" },
      { status: 500 }
    );
  }
}

// GET /api/files/kml - List KML/KMZ files for tenant
export async function GET() {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  try {
    // Get both KML and KMZ files
    const files = await listFiles(auth.tenant.id);

    // Filter to only KML/KMZ types
    const kmlFiles = files.filter(
      (f) => f.type === FileType.KML || f.type === FileType.KMZ
    );

    return NextResponse.json({ items: kmlFiles });
  } catch (err) {
    console.error("File list error:", err);
    return NextResponse.json(
      { error: "Failed to list files", code: "LIST_ERROR" },
      { status: 500 }
    );
  }
}
