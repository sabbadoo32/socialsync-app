import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string;
  role: "admin" | "user";
  name: string | null;
};

/**
 * Resolve the logged-in user from the Supabase session, mapped to our User row
 * (the allowlist / role store). Returns null if not authenticated or not on the team.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
