import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthApi } from "@/server/auth";
import { createListing, getListings } from "@/server/listings";

// Validation schemas
const parcelInfoSchema = z.object({
  il: z.string().optional().default(""),
  ilce: z.string().optional().default(""),
  mahalle: z.string().optional().default(""),
  ada: z.string().min(1),
  parsel: z.string().min(1),
  mahalleId: z.string().optional(),
  alan: z.union([z.string(), z.number()]).optional(),
  mevkii: z.string().optional(),
  nitelik: z.string().optional(),
});

const geometrySchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.object({
      type: z.literal("Feature"),
      geometry: z.object({
        type: z.enum(["Polygon", "MultiPolygon"]),
        coordinates: z.any(),
      }),
      properties: z.any(),
    })
  ),
});

const centroidSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const bboxSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);

const createListingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  parcelInfo: parcelInfoSchema,
  geometry: geometrySchema,
  centroid: centroidSchema,
  bbox: bboxSchema,
});

/**
 * GET /api/listings - List all listings for tenant
 */
export async function GET(request: NextRequest) {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const result = await getListings(auth, { page, limit });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[API /listings] GET error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/listings - Create a new listing
 */
export async function POST(request: NextRequest) {
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  try {
    const body = await request.json();
    const parsed = createListingSchema.safeParse(body);

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

    const listing = await createListing(auth, parsed.data);

    return NextResponse.json({ listing }, { status: 201 });
  } catch (err) {
    console.error("[API /listings] POST error:", err);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
