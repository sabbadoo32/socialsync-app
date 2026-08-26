"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

export default function AppSidebar({ user }) {
  const pathname = usePathname();
  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();
  return (
    <aside className="w-60 flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0">
      <div className="px-5 py-5 flex items-center gap-2.5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-sm">
          P
        </div>
        <span className="font-bold text-white text-lg tracking-tight">Postly</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-medium">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-slate-200 truncate">{user?.name || user?.email || "Not signed in"}</p>
            {user?.role && (
              <p className="text-[11px] text-slate-500 capitalize">{user.role === "admin" ? "Approver" : "Member"}</p>
            )}
          </div>
        </div>
        {user && (
          <form action="/auth/signout" method="post" className="px-3 mt-1">
            <button type="submit" className="w-full text-left text-xs text-slate-400 hover:text-white py-1">
              Sign out
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
