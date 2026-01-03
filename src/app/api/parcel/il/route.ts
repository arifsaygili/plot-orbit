import { NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import { getIlList, UpstreamError, ParcelErrorCode } from "@/server/parcel";

/**
 * GET /api/parcel/il
 * Returns list of all provinces (il)
 */
export async function GET() {
  // Require authentication
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  try {
    const items = await getIlList();

    return NextResponse.json({
      items,
      count: items.length,
    });
  } catch (err) {
    console.error("[API /parcel/il] Error:", err);

    if (err instanceof UpstreamError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }

    // Check for missing env
    if (err instanceof Error && err.message.includes("Missing required environment")) {
      return NextResponse.json(
        { error: "Service not configured", code: ParcelErrorCode.MISSING_ENV },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
