import { NextRequest, NextResponse } from "next/server";
import { metaConfigured, oauthUrl } from "@/lib/platforms/meta";

export const dynamic = "force-dynamic";

/** Starts the Facebook OAuth flow — redirects the admin to Facebook to approve. */
export async function GET(req: NextRequest) {
  if (!metaConfigured()) {
    return NextResponse.json(
      { error: "Facebook isn't set up yet (missing META_APP_ID / META_APP_SECRET)." },
      { status: 501 }
    );
  }
  const redirectUri = `${req.nextUrl.origin}/api/platforms/meta/callback`;
  const state = Math.random().toString(36).slice(2);
  const res = NextResponse.redirect(oauthUrl(redirectUri, state));
  res.cookies.set("meta_oauth_state", state, { httpOnly: true, maxAge: 600, path: "/" });
  return res;
}
