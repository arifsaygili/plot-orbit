import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import { getListing, updateListing } from "@/server/listings";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/listings/[id]/generate-description - Generate AI description (placeholder)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;

  try {
    const listing = await getListing(auth, id);

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // TODO: Implement actual AI description generation
    // For now, return a placeholder message
    const placeholderDescription = `This is a property located in ${listing.parcelInfo.mahalle}, ${listing.parcelInfo.ilce}, ${listing.parcelInfo.il}. ` +
      `Block (Ada): ${listing.parcelInfo.ada}, Lot (Parsel): ${listing.parcelInfo.parsel}. ` +
      `${listing.parcelInfo.area ? `Total area: ${listing.parcelInfo.area.toLocaleString()} m². ` : ""}` +
      `\n\nAI-powered description generation is coming soon. This feature will analyze the property location, ` +
      `surrounding amenities, and market data to create compelling listing descriptions.`;

    // Update the listing with the generated description
    const updated = await updateListing(auth, id, {
      aiDescription: placeholderDescription,
    });

    return NextResponse.json({
      listing: updated,
      message: "AI description generation is a placeholder. Full feature coming soon.",
    });
  } catch (err) {
    console.error("[API /listings/:id/generate-description] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
