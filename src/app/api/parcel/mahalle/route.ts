import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import { getMahalleList, UpstreamError, ParcelErrorCode } from "@/server/parcel";

/**
 * GET /api/parcel/mahalle?ilceId=<ilceId>
 * Returns list of neighborhoods for a district
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  // Validate query params
  const { searchParams } = new URL(request.url);
  const ilceId = searchParams.get("ilceId");

  if (!ilceId) {
    return NextResponse.json(
      { error: "Missing required parameter: ilceId", code: ParcelErrorCode.MISSING_PARAMETER },
      { status: 400 }
    );
  }

  try {
    const items = await getMahalleList(ilceId);

    return NextResponse.json({
      items,
      count: items.length,
      ilceId,
    });
  } catch (err) {
    console.error("[API /parcel/mahalle] Error:", err);

    if (err instanceof UpstreamError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.statusCode }
      );
    }

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
