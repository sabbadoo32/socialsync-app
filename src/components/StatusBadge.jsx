import { statusMeta } from "@/lib/nav-config";
import { cn } from "@/lib/utils";

export default function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta.draft;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border", meta.color)}>
      {meta.label}
    </span>
  );
}