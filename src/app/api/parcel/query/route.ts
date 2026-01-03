import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import {
  queryParsel,
  normalizeParcelResponse,
  UpstreamError,
  ParcelErrorCode,
} from "@/server/parcel";

/**
 * GET /api/parcel/query?mahalleId=<mahalleId>&ada=<ada>&parsel=<parsel>
 * Query a specific parcel and return normalized result with GeoJSON
 */
export async function GET(request: NextRequest) {
  // Require authentication
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  // Validate query params
  const { searchParams } = new URL(request.url);
  const mahalleId = searchParams.get("mahalleId");
  const ada = searchParams.get("ada");
  const parsel = searchParams.get("parsel");

  const missingParams: string[] = [];
  if (!mahalleId) missingParams.push("mahalleId");
  if (!ada) missingParams.push("ada");
  if (!parsel) missingParams.push("parsel");

  if (missingParams.length > 0) {
    return NextResponse.json(
      {
        error: `Missing required parameters: ${missingParams.join(", ")}`,
        code: ParcelErrorCode.MISSING_PARAMETER,
      },
      { status: 400 }
    );
  }

  // Validate ada and parsel are numeric-ish
  if (!/^\d+$/.test(ada!)) {
    return NextResponse.json(
      { error: "Parameter 'ada' must be numeric", code: ParcelErrorCode.INVALID_PARAMETER },
      { status: 400 }
    );
  }

  if (!/^\d+$/.test(parsel!)) {
    return NextResponse.json(
      { error: "Parameter 'parsel' must be numeric", code: ParcelErrorCode.INVALID_PARAMETER },
      { status: 400 }
    );
  }

  try {
    const raw = await queryParsel({
      mahalleId: mahalleId!,
      ada: ada!,
      parsel: parsel!,
    });

    const result = normalizeParcelResponse(raw, {
      mahalleId: mahalleId!,
      ada: ada!,
      parsel: parsel!,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[API /parcel/query] Error:", err);

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
