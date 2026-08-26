"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Post, Campaign } from "@/api/entities";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Calendar() {
  const [posts, setPosts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    Promise.all([Post.list("-created_date", 200), Campaign.list()])
      .then(([p, c]) => {
        setPosts(p);
        setCampaigns(c);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const campaignMap = campaigns.reduce((acc, c) => ({ ...acc, [c.id]: c }), {} as Record<string, any>);
  const monthName = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const days = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const result: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) result.push(null);
    for (let d = 1; d <= totalDays; d++) result.push(new Date(year, month, d));
    const trailing = (7 - (result.length % 7)) % 7;
    for (let i = 0; i < trailing; i++) result.push(null);
    return result;
  }, [currentDate]);

  const postsForDate = (date: Date) =>
    posts.filter((p) => {
      if (!p.scheduled_date && p.status !== "published") return false;
      const d = p.scheduled_date || p.published_date;
      if (!d) return false;
      const postDate = new Date(d);
      return (
        postDate.getDate() === date.getDate() &&
        postDate.getMonth() === date.getMonth() &&
        postDate.getFullYear() === date.getFullYear()
      );
    });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const today = new Date();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <PageHeader title="Calendar" subtitle="Posts scheduled and published">
        <Link href="/compose">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <PenSquare className="w-4 h-4 mr-1.5" /> Compose
          </Button>
        </Link>
      </PageHeader>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800">{monthName}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="px-2 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((date, i) => {
            if (!date) return <div key={i} className="min-h-[100px] border-r border-b border-slate-100 bg-slate-50/50" />;
            const dayPosts = postsForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            return (
              <div key={i} className="min-h-[100px] border-r border-b border-slate-100 p-1.5 overflow-hidden">
                <div className={cn("text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                  isToday ? "bg-indigo-600 text-white" : "text-slate-400")}>
                  {date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayPosts.slice(0, 3).map((post) => (
                    <Link
                      key={post.id}
                      href={`/compose/${post.id}`}
                      className="block text-xs px-1.5 py-1 rounded truncate hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: `${campaignMap[post.campaign_id]?.color || "#4F46E5"}15`,
                        color: campaignMap[post.campaign_id]?.color || "#4F46E5",
                        borderLeft: `2px solid ${campaignMap[post.campaign_id]?.color || "#4F46E5"}`,
                      }}
                    >
                      {post.title}
                    </Link>
                  ))}
                  {dayPosts.length > 3 && (
                    <p className="text-xs text-slate-400 px-1.5">+{dayPosts.length - 3} more</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
