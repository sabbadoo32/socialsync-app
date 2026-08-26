import { NextRequest, NextResponse } from "next/server";
import { threadsConfigured, threadsOauthUrl } from "@/lib/platforms/threads";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!threadsConfigured()) {
    return NextResponse.json({ error: "Threads isn't set up yet (missing THREADS_APP_ID / SECRET)." }, { status: 501 });
  }
  const redirectUri = `${req.nextUrl.origin}/api/platforms/threads/callback`;
  const state = Math.random().toString(36).slice(2);
  const res = NextResponse.redirect(threadsOauthUrl(redirectUri, state));
  res.cookies.set("threads_oauth_state", state, { httpOnly: true, maxAge: 600, path: "/" });
  return res;
}
