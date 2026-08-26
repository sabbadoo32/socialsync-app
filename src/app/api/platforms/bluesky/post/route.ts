import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { postToBluesky } from "@/lib/platforms/bluesky";

export const dynamic = "force-dynamic";

const schema = z.object({
  identifier: z.string().min(1),
  appPassword: z.string().min(1),
  text: z.string().min(1).max(3000),
  imageUrls: z.array(z.string().url()).optional().default([]),
});

/** Post to Bluesky immediately with provided credentials. Useful for testing. */
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { identifier, appPassword, text, imageUrls } = parsed.data;

  try {
    const images = [];
    for (const url of imageUrls) {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
      images.push({
        data: new Uint8Array(await res.arrayBuffer()),
        mimeType: res.headers.get("content-type") ?? "image/jpeg",
      });
    }
    const result = await postToBluesky({ identifier, appPassword }, text, images);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "post failed" },
      { status: 502 }
    );
  }
}
