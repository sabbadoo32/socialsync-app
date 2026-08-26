"use client";

import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import PlatformBadges from "@/components/PlatformBadges";
import { Image as ImageIcon, Clock, FolderKanban } from "lucide-react";

export default function PostCard({ post, campaign }) {
  return (
    <Link
      href={`/compose/${post.id}`}
      className="block bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-indigo-200 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-2">{post.title}</h3>
        <StatusBadge status={post.status} />
      </div>
      <p className="text-xs text-slate-500 line-clamp-2 mb-3">
        {post.base_caption || post.caption_overrides?.[post.platforms?.[0]] || "No caption yet"}
      </p>
      <div className="flex items-center justify-between">
        <PlatformBadges platforms={post.platforms} size="sm" />
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {post.media_urls?.length > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3 h-3" /> {post.media_urls.length}
            </span>
          )}
          {post.scheduled_date && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{" "}
              {new Date(post.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
          {campaign && (
            <span className="flex items-center gap-1" style={{ color: campaign.color }}>
              <FolderKanban className="w-3 h-3" /> {campaign.name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
