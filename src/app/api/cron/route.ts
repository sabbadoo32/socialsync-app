import { NextRequest, NextResponse } from "next/server";
import { processDuePosts } from "@/lib/publish";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Invoked by Vercel Cron every minute (see vercel.json).
 * Vercel sends `Authorization: Bearer $CRON_SECRET`; we reject anything else.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDuePosts();
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "cron failed" },
      { status: 500 }
    );
  }
}
