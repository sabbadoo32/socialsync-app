import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Magic-link callback. Exchanges the code for a session, then enforces the
 * allowlist: the email must already exist in our User table (added by an admin).
 * Unknown emails are signed out and bounced to /login with an error.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user?.email) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const email = data.user.email.toLowerCase();

  // Allowlist check: must be a pre-added team member.
  const member = await prisma.user.findUnique({ where: { email } });
  if (!member) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=not_registered`);
  }

  return NextResponse.redirect(origin + "/");
}
