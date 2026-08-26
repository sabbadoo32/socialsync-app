import { NextResponse } from "next/server";
import { driveConfigured, serviceAccountEmail } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

/** Tells the UI whether Drive is set up, and which email to share folders with. */
export async function GET() {
  return NextResponse.json({
    configured: driveConfigured(),
    serviceAccountEmail: serviceAccountEmail(),
  });
}
