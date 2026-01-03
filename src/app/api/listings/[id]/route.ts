import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthApi } from "@/server/auth";
import { getListing, updateListing, deleteListing } from "@/server/listings";

const updateListingSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  aiDescription: z.string().max(5000).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/listings/[id] - Get a single listing
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    return NextResponse.json({ listing });
  } catch (err) {
    console.error("[API /listings/:id] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/listings/[id] - Update a listing
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = updateListingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          code: "VALIDATION_ERROR",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const listing = await updateListing(auth, id, parsed.data);

    if (!listing) {
      return NextResponse.json(
        { error: "Listing not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ listing });
  } catch (err) {
    console.error("[API /listings/:id] PATCH error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/listings/[id] - Delete a listing
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  const { id } = await params;

  try {
    const deleted = await deleteListing(auth, id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Listing not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[API /listings/:id] DELETE error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
