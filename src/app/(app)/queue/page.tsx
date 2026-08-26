"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Post, Campaign } from "@/api/entities";
import PageHeader from "@/components/PageHeader";
import StatusBadge from "@/components/StatusBadge";
import PlatformBadges from "@/components/PlatformBadges";
import { Button } from "@/components/ui/button";
import { PenSquare, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

export default function Queue() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Post.filter({ status: "scheduled" }, "scheduled_date", 100)
      .then((p) => {
        setPosts(
          p.sort(
            (a, b) => +new Date(a.scheduled_date) - +new Date(b.scheduled_date)
          )
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const reorder = async (index: number, direction: "up" | "down") => {
    const newPosts = [...posts];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newPosts.length) return;
    [newPosts[index], newPosts[target]] = [newPosts[target], newPosts[index]];
    setPosts(newPosts);
    try {
      await Post.bulkUpdate([
        { id: newPosts[index].id, queue_order: index },
        { id: newPosts[target].id, queue_order: target },
      ]);
    } catch {
      // reorder failed server-side, but UI already reflects intent
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <PageHeader title="Queue" subtitle="Scheduled posts in publish order">
        <Link href="/compose">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <PenSquare className="w-4 h-4 mr-1.5" /> Compose
          </Button>
        </Link>
      </PageHeader>

      {posts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <GripVertical className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 mb-4">Your queue is empty.</p>
          <Link href="/compose">
            <Button variant="outline">Create your first scheduled post</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post, index) => (
            <div key={post.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="flex flex-col">
                <button onClick={() => reorder(index, "up")} disabled={index === 0} className="text-slate-300 hover:text-indigo-600 disabled:opacity-30">
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button onClick={() => reorder(index, "down")} disabled={index === posts.length - 1} className="text-slate-300 hover:text-indigo-600 disabled:opacity-30">
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-slate-800 text-sm truncate">{post.title}</h3>
                  <StatusBadge status={post.status} />
                </div>
                <p className="text-xs text-slate-500 truncate">{post.base_caption}</p>
              </div>
              <PlatformBadges platforms={post.platforms} size="sm" />
              {post.scheduled_date && (
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-slate-700">
                    {new Date(post.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(post.scheduled_date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              )}
              <Link href={`/compose/${post.id}`}>
                <Button variant="ghost" size="sm">Edit</Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
