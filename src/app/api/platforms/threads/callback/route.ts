import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/current-user";
import { threadsExchangeCode } from "@/lib/platforms/threads";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const saved = req.cookies.get("threads_oauth_state")?.value;
  const back = `${origin}/accounts`;

  if (!code || !state || state !== saved) {
    return NextResponse.redirect(`${back}?threads_error=state`);
  }
  try {
    const redirectUri = `${origin}/api/platforms/threads/callback`;
    const { token, userId: threadsUserId } = await threadsExchangeCode(code, redirectUri);
    const userId = await getCurrentUserId();
    await prisma.socialAccount.upsert({
      where: { userId_platform: { userId, platform: "threads" } },
      create: { userId, platform: "threads", platformUserId: threadsUserId, accessToken: token },
      update: { platformUserId: threadsUserId, accessToken: token },
    });
    return NextResponse.redirect(`${back}?threads_connected=1`);
  } catch (e: any) {
    return NextResponse.redirect(`${back}?threads_error=${encodeURIComponent(e.message)}`);
  }
}
