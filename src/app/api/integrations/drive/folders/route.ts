import { NextRequest, NextResponse } from "next/server";
import { listFolders, listMediaInFolder } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

/**
 * GET /api/integrations/drive/folders            -> folders shared with the app
 * GET /api/integrations/drive/folders?folderId=X -> image/video files in folder X
 */
export async function GET(req: NextRequest) {
  const folderId = req.nextUrl.searchParams.get("folderId");
  try {
    const files = folderId ? await listMediaInFolder(folderId) : await listFolders();
    return NextResponse.json({ files });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 502 });
  }
}
