import { NextResponse } from "next/server";
import { requireAuthApi } from "@/server/auth";
import { canCreateVideo, consumeVideoCredit } from "@/server/quota";

export async function POST() {
  // Check authentication
  const { auth, error } = await requireAuthApi();
  if (error) return error;

  const tenantId = auth.tenant.id;

  // Check quota
  const canCreate = await canCreateVideo(tenantId);
  if (!canCreate.ok) {
    return NextResponse.json(
      { ok: false, code: canCreate.code, message: canCreate.message },
      { status: 403 }
    );
  }

  // Consume credit
  const consumeResult = await consumeVideoCredit(tenantId);
  if (!consumeResult.ok) {
    return NextResponse.json(
      { ok: false, code: consumeResult.code, message: consumeResult.message },
      { status: 403 }
    );
  }

  return NextResponse.json({
    ok: true,
    videosCreatedLifetime: consumeResult.videosCreatedLifetime,
  });
}
