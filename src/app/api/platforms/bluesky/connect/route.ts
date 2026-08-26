import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyBlueskyConnection } from "@/lib/platforms/bluesky";

export const dynamic = "force-dynamic";

const schema = z.object({
  userId: z.string().min(1),
  identifier: z.string().min(1),
  appPassword: z.string().min(1),
});

/**
 * Verify Bluesky App Password credentials and store them on the user's account.
 * NOTE: app passwords are stored as-is for now; encrypt at rest before production.
 */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { userId, identifier, appPassword } = parsed.data;

  try {
    const { did, handle } = await verifyBlueskyConnection({ identifier, appPassword });

    const account = await prisma.socialAccount.upsert({
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

    return NextResponse.json({ ok: true, handle, did, accountId: account.id });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "connection failed" },
      { status: 502 }
    );
  }
}
