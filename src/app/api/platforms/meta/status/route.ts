import { NextResponse } from "next/server";
import { metaConfigured } from "@/lib/platforms/meta";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ configured: metaConfigured() });
}
