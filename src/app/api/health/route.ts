import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Reports which env vars production can see (booleans only — never values). */
export async function GET() {
  const present = (v?: string) => Boolean(v && !v.startsWith("your-"));
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: present(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: present(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    DATABASE_URL: present(process.env.DATABASE_URL),
    CRON_SECRET: present(process.env.CRON_SECRET),
    anon_key_prefix: (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").slice(0, 6),
  });
}
