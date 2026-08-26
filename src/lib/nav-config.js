import { LayoutDashboard, PenSquare, ListOrdered, CalendarDays, Image, FolderKanban, Users, Link2 } from "lucide-react";

export const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Compose", path: "/compose", icon: PenSquare },
  { label: "Queue", path: "/queue", icon: ListOrdered },
  { label: "Calendar", path: "/calendar", icon: CalendarDays },
  { label: "Media Library", path: "/media", icon: Image },
  { label: "Campaigns", path: "/campaigns", icon: FolderKanban },
  { label: "Connected Accounts", path: "/accounts", icon: Link2 },
  { label: "Team", path: "/team", icon: Users },
];

export const platforms = ["facebook", "instagram", "bluesky", "tiktok", "threads"];

export const platformMeta = {
  facebook: { label: "Facebook", color: "#1877F2" },
  instagram: { label: "Instagram", color: "#E4405F" },
  bluesky: { label: "Bluesky", color: "#1185FE" },
  tiktok: { label: "TikTok", color: "#000000" },
  threads: { label: "Threads", color: "#000000" },
};

export const statusMeta = {
  draft: { label: "Draft", color: "bg-slate-100 text-slate-600 border-slate-200" },
  pending_approval: { label: "Pending Approval", color: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Approved", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  scheduled: { label: "Scheduled", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  published: { label: "Published", color: "bg-green-100 text-green-700 border-green-200" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 border-red-200" },
};