import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import { getIlceList, UpstreamError, ParcelErrorCode } from "@/server/parcel";

/**
 * GET /api/parcel/ilce?ilId=<ilId>
 * Returns list of districts for a province
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  // Validate query params
  const { searchParams } = new URL(request.url);
  const ilId = searchParams.get("ilId");

  if (!ilId) {
    return NextResponse.json(
      { error: "Missing required parameter: ilId", code: ParcelErrorCode.MISSING_PARAMETER },
      { status: 400 }
    );
  }

  try {
    const items = await getIlceList(ilId);

    return NextResponse.json({
      items,
      count: items.length,
      ilId,
    });
  } catch (err) {
    console.error("[API /parcel/ilce] Error:", err);

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
