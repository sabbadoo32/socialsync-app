import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import { exchangeCode, longLivedToken, listPages } from "@/lib/platforms/meta";

export const dynamic = "force-dynamic";

/**
 * Facebook OAuth callback. Exchanges the code, upgrades to a long-lived token,
 * lists the user's Pages, and stores the first Page's token as the facebook
 * connection. (Multi-page selection UI: future.)
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const savedState = req.cookies.get("meta_oauth_state")?.value;
  const back = `${origin}/accounts`;

  if (searchParams.get("error")) {
    return NextResponse.redirect(`${back}?meta_error=denied`);
  }
  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${back}?meta_error=state`);
  }

  try {
    const redirectUri = `${origin}/api/platforms/meta/callback`;
    const userToken = await exchangeCode(code, redirectUri);
    const longToken = await longLivedToken(userToken);
    const pages = await listPages(longToken);
    if (pages.length === 0) {
      return NextResponse.redirect(`${back}?meta_error=no_pages`);
    }
    const page = pages[0];
    const userId = await getCurrentUserId();

    await prisma.socialAccount.upsert({
      where: { userId_platform: { userId, platform: "facebook" } },
      create: {
        userId,
        platform: "facebook",
        platformUserId: page.id,
        accessToken: page.access_token,
        metadata: { pageName: page.name, allPages: pages.map((p) => ({ id: p.id, name: p.name })) },
      },
      update: {
        platformUserId: page.id,
        accessToken: page.access_token,
        metadata: { pageName: page.name, allPages: pages.map((p) => ({ id: p.id, name: p.name })) },
      },
    });

    return NextResponse.redirect(`${back}?meta_connected=1`);
  } catch (e: any) {
    return NextResponse.redirect(`${back}?meta_error=${encodeURIComponent(e.message)}`);
  }
}
