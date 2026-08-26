import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyBlueskyConnection } from "@/lib/platforms/bluesky";
import { getCurrentUserId } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const schema = z.object({
  identifier: z.string().min(1),
  appPassword: z.string().min(1),
});

/**
 * Verify a Bluesky App Password and store it on the current user's account.
 * (App passwords are stored as-is for now; encrypt at rest before wide use.)
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Handle and app password are required" }, { status: 400 });
  }
  const { identifier, appPassword } = parsed.data;

  try {
    const userId = await getCurrentUserId();
    const { did, handle } = await verifyBlueskyConnection({ identifier, appPassword });

    await prisma.socialAccount.upsert({
      where: { userId_platform: { userId, platform: "bluesky" } },
      create: {
        userId,
        platform: "bluesky",
        platformUserId: identifier,
        accessToken: appPassword,
        metadata: { did, handle },
      },
      update: {
        platformUserId: identifier,
        accessToken: appPassword,
        metadata: { did, handle },
      },
    });

    return NextResponse.json({ ok: true, handle, did });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "connection failed" },
      { status: 502 }
    );
  }
}
