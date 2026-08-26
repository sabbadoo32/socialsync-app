import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import { tiktokExchangeCode } from "@/lib/platforms/tiktok";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const saved = req.cookies.get("tiktok_oauth_state")?.value;
  const back = `${origin}/accounts`;

  if (!code || !state || state !== saved) {
    return NextResponse.redirect(`${back}?tiktok_error=state`);
  }
  try {
    const redirectUri = `${origin}/api/platforms/tiktok/callback`;
    const { token, refreshToken, openId, expiresIn } = await tiktokExchangeCode(code, redirectUri);
    const userId = await getCurrentUserId();
    await prisma.socialAccount.upsert({
      where: { userId_platform: { userId, platform: "tiktok" } },
      create: {
        userId,
        platform: "tiktok",
        platformUserId: openId,
        accessToken: token,
        refreshToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      },
      update: {
        platformUserId: openId,
        accessToken: token,
        refreshToken,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });
    return NextResponse.redirect(`${back}?tiktok_connected=1`);
  } catch (e: any) {
    return NextResponse.redirect(`${back}?tiktok_error=${encodeURIComponent(e.message)}`);
  }
}
