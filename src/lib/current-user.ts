import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  role: "admin" | "user";
  name: string | null;
};

/** Auth is OFF until we're ready to add the team (set AUTH_ENABLED=true to turn on). */
export const AUTH_ENABLED = process.env.AUTH_ENABLED === "true";

// When auth is off, the app runs as this single admin.
const SOLO_ADMIN_EMAIL = "sabbadoo32@gmail.com";

async function soloAdmin(): Promise<CurrentUser | null> {
  const admin = await prisma.user.upsert({
    where: { email: SOLO_ADMIN_EMAIL },
    update: {},
    create: { email: SOLO_ADMIN_EMAIL, name: "Sebastian", role: "admin" },
  });
  return { id: admin.id, email: admin.email, role: "admin", name: admin.name };
}

/**
 * Resolve the current user. With auth off, returns the solo admin so the whole
 * app just works. With auth on, reads the Supabase session + allowlist.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!AUTH_ENABLED) return soloAdmin();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  let user = null;
  try {
    const supabase = createClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    return null;
  }
  if (!user?.email) return null;

  const member = await prisma.user.findUnique({
    where: { email: user.email.toLowerCase() },
  });
  if (!member) return null;

  return {
    id: member.id,
    email: member.email,
    role: member.role as "admin" | "user",
    name: member.name,
  };
}

/** Returns the current user's id, or throws if unauthenticated. */
export async function getCurrentUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error("unauthenticated");
  return user.id;
}
