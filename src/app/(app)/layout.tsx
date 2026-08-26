import AppSidebar from "@/components/AppSidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AppSidebar />
      <main className="flex-1 overflow-x-hidden">{children}</main>
    </div>
  );
}
