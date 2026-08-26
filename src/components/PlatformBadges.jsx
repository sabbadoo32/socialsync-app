import { platformMeta } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

function PlatformDot({ platform, size = "md" }) {
  const meta = platformMeta[platform];
  if (!meta) return null;
  const sizeClass = size === "sm" ? "w-5 h-5 text-[8px]" : "w-6 h-6 text-[9px]";
  const initials = platform === "facebook" ? "f" : platform === "instagram" ? "IG" : platform === "bluesky" ? "BS" : platform === "tiktok" ? "TT" : "TH";
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-full text-white font-bold flex-shrink-0", sizeClass)}
      style={{ backgroundColor: meta.color }}
      title={meta.label}
    >
      {initials}
    </span>
  );
}

export default function PlatformBadges({ platforms, size = "md" }) {
  if (!platforms || platforms.length === 0) return null;
  return (
    <div className="flex items-center gap-1">
      {platforms.map((p) => (
        <PlatformDot key={p} platform={p} size={size} />
      ))}
    </div>
  );
}