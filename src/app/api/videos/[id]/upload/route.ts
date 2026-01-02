import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import { saveVideoFile } from "@/server/videos";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Max upload size: 100MB
const MAX_SIZE = 100 * 1024 * 1024;

/**
 * POST /api/videos/[id]/upload - Upload video file
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;

  // Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, code: "INVALID_FORM", message: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { ok: false, code: "NO_FILE", message: "No file provided" },
      { status: 400 }
    );
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      {
        ok: false,
        code: "FILE_TOO_LARGE",
        message: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`,
      },
      { status: 400 }
    );
  }

  // Validate MIME type
  if (!file.type.startsWith("video/")) {
    return NextResponse.json(
      { ok: false, code: "INVALID_TYPE", message: "File must be a video" },
      { status: 400 }
    );
  }

  // Save file
  const result = await saveVideoFile(
    id,
    auth.tenant.id,
    auth.user.id,
    file,
    file.name
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, code: "SAVE_FAILED", message: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    fileId: result.fileId,
  });
}
