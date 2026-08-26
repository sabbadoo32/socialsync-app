import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Magic-link callback. Exchanges the link for a session, writing the auth
 * cookies onto the SAME redirect response (so the session survives), then
 * enforces the email allowlist.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // The response we'll return — cookies get written onto THIS object.
  const success = NextResponse.redirect(origin + "/");

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            success.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let email: string | undefined;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user?.email) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
    email = data.user.email;
  } else if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    });
    if (error || !data.user?.email) {
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }
    email = data.user.email;
  } else {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Allowlist: must be a pre-added team member.
  const member = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (!member) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=not_registered`);
  }

  return success;
}
