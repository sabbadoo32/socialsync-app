import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";

export const dynamic = "force-dynamic";

/** List the current user's connected accounts (no secrets returned). */
export async function GET() {
  const userId = await getCurrentUserId();
  const accounts = await prisma.socialAccount.findMany({
    where: { userId },
    select: { id: true, platform: true, platformUserId: true, metadata: true, createdAt: true },
  });
  return NextResponse.json({ accounts });
}

/** Disconnect a platform: DELETE /api/accounts?platform=bluesky */
export async function DELETE(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform");
  if (!platform) return NextResponse.json({ error: "Missing platform" }, { status: 400 });
  const userId = await getCurrentUserId();
  await prisma.socialAccount.deleteMany({ where: { userId, platform: platform as any } });
  return NextResponse.json({ ok: true });
}
