import { NextRequest, NextResponse } from "next/server";
import { fetchDriveFile } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

/**
 * Streams a Drive file's bytes through the app, so the Media Library can display
 * private Drive images without making them public. Also used when publishing.
 * GET /api/integrations/drive/media?id=<driveFileId>
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  try {
    const { body, mimeType } = await fetchDriveFile(id);
    return new NextResponse(body, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
