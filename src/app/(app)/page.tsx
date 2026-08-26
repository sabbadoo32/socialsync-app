"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Post, Campaign } from "@/api/entities";
import PageHeader from "@/components/PageHeader";
import PostCard from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { PenSquare, Clock, CheckCircle, AlertCircle, Send } from "lucide-react";

export default function Dashboard() {
  const [posts, setPosts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([Post.list("-created_date", 100), Campaign.list()])
      .then(([p, c]) => {
        setPosts(p);
        setCampaigns(c);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, any>);
  const stats = {
    drafts: posts.filter((p) => p.status === "draft").length,
    pending: posts.filter((p) => p.status === "pending_approval").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
  };

  const statCards = [
    { label: "Drafts", value: stats.drafts, icon: PenSquare, color: "text-slate-600", bg: "bg-slate-100" },
    { label: "Pending Approval", value: stats.pending, icon: Send, color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Scheduled", value: stats.scheduled, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-100" },
    { label: "Published", value: stats.published, icon: CheckCircle, color: "text-green-600", bg: "bg-green-100" },
  ];

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const attention = posts.filter((p) => p.status === "pending_approval" || p.status === "draft");
  const published = posts.filter((p) => p.status === "published");

  return (
    <div className="p-6 md:p-8">
      <PageHeader title="Dashboard" subtitle="Your social media command center">
        <Link href="/compose">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <PenSquare className="w-4 h-4 mr-1.5" /> Compose
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Needs Attention</h2>
          <Link href="/queue" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attention.slice(0, 6).map((post) => (
            <PostCard key={post.id} post={post} campaign={campaignMap[post.campaign_id]} />
          ))}
        </div>
        {attention.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">All caught up — no posts need attention.</p>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recently Published</h2>
          <Link href="/calendar" className="text-sm text-indigo-600 hover:underline">View calendar</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {published.slice(0, 6).map((post) => (
            <PostCard key={post.id} post={post} campaign={campaignMap[post.campaign_id]} />
          ))}
        </div>
        {published.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <CheckCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No published posts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
