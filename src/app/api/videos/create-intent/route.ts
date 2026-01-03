import { NextRequest, NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import { canCreateVideo, consumeVideoCredit } from "@/server/quota";
import { prisma } from "@/lib/prisma";

interface CreateIntentBody {
  listingId?: string;
}

export async function POST(request: NextRequest) {
  // Check authentication
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  const tenantId = auth.tenant.id;
  const userId = auth.user.id;

  // Parse optional body
  let listingId: string | undefined;
  try {
    const body = (await request.json()) as CreateIntentBody;
    listingId = body.listingId;
  } catch {
    // Body is optional
  }

  // Validate listingId belongs to tenant if provided
  if (listingId) {
    const listing = await prisma.listing.findFirst({
      where: {
        id: listingId,
        tenantId,
      },
    });
    if (!listing) {
      return NextResponse.json(
        { ok: false, code: "INVALID_LISTING", message: "Listing not found" },
        { status: 400 }
      );
    }
  }

  // Check quota
  const canCreate = await canCreateVideo(tenantId);
  if (!canCreate.ok) {
    return NextResponse.json(
      { ok: false, code: canCreate.code, message: canCreate.message },
      { status: 403 }
    );
  }

  // Consume credit and create video in transaction
  const consumeResult = await consumeVideoCredit(tenantId);
  if (!consumeResult.ok) {
    return NextResponse.json(
      { ok: false, code: consumeResult.code, message: consumeResult.message },
      { status: 403 }
    );
  }

  // Create Video record
  const video = await prisma.video.create({
    data: {
      tenantId,
      createdByUserId: userId,
      status: "CREATED",
      listingId: listingId || null,
    },
  });

  return NextResponse.json({
    ok: true,
    videoId: video.id,
    uploadPath: `/api/videos/${video.id}/upload`,
    videosCreatedLifetime: consumeResult.videosCreatedLifetime,
  });
}
