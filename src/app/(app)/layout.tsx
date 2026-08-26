import AppSidebar from "@/components/AppSidebar";
import { getCurrentUser } from "@/lib/current-user";

export default async function AppShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar user={user} />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
