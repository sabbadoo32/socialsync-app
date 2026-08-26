import { prisma } from "@/lib/prisma";

/**
 * TEMPORARY: returns a single demo user until real auth is ported in.
 * Ensures the row exists so foreign keys resolve. Replace with session
 * lookup (Supabase Auth / NextAuth) when the auth pages are wired up.
 */
export const DEMO_USER_ID = "demo-user";

export async function getCurrentUserId(): Promise<string> {
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {},
    create: {
      id: DEMO_USER_ID,
      email: "demo@new-buffer.local",
      name: "Demo User",
      role: "admin",
    },
  });
  return DEMO_USER_ID;
}
