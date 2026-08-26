import { NextRequest, NextResponse } from "next/server";
import { tiktokConfigured, tiktokOauthUrl } from "@/lib/platforms/tiktok";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!tiktokConfigured()) {
    return NextResponse.json({ error: "TikTok isn't set up yet (missing TIKTOK_CLIENT_KEY / SECRET)." }, { status: 501 });
  }
  const redirectUri = `${req.nextUrl.origin}/api/platforms/tiktok/callback`;
  const state = Math.random().toString(36).slice(2);
  const res = NextResponse.redirect(tiktokOauthUrl(redirectUri, state));
  res.cookies.set("tiktok_oauth_state", state, { httpOnly: true, maxAge: 600, path: "/" });
  return res;
}
