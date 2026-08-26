"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Post, Campaign } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { platforms, platformMeta } from "@/lib/nav-config";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Image as ImageIcon, Send, Check, X, Clock, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

export default function ComposeForm({ id }: { id?: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [post, setPost] = useState<any>({
    title: "",
    platforms: [],
    base_caption: "",
    caption_overrides: {},
    status: "draft",
    scheduled_date: "",
    media_urls: [],
    campaign_id: "",
    approval_feedback: "",
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showOverrides, setShowOverrides] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Campaign.list().then(setCampaigns).catch(() => {});
    if (isEditing && id) {
      Post.get(id)
        .then((p) => {
          setPost({ ...p, caption_overrides: p.caption_overrides || {}, media_urls: p.media_urls || [] });
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          toast({ title: "Post not found", variant: "destructive" });
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const togglePlatform = (platform: string) => {
    setPost((prev: any) => {
      const has = prev.platforms.includes(platform);
      const next = has ? prev.platforms.filter((p: string) => p !== platform) : [...prev.platforms, platform];
      const overrides = { ...prev.caption_overrides };
      if (has) delete overrides[platform];
      return { ...prev, platforms: next, caption_overrides: overrides };
    });
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const { file_url } = await UploadFile({ file });
        urls.push(file_url);
      }
      setPost((prev: any) => ({ ...prev, media_urls: [...prev.media_urls, ...urls] }));
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = (idx: number) => {
    setPost((prev: any) => ({ ...prev, media_urls: prev.media_urls.filter((_: any, i: number) => i !== idx) }));
  };

  const save = async (statusOverride?: string) => {
    if (!post.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (post.platforms.length === 0) {
      toast({ title: "Select at least one platform", variant: "destructive" });
      return;
    }
    const payload = { ...post, status: statusOverride || post.status };
    // Don't send server-managed fields back.
    delete payload.id;
    delete payload.user_id;
    delete payload.created_date;
    delete payload.updated_date;
    if (payload.scheduled_date === "") payload.scheduled_date = null;
    if (payload.campaign_id === "") payload.campaign_id = null;
    try {
      if (isEditing && id) {
        await Post.update(id, payload);
      } else {
        const created = await Post.create(payload);
        router.replace(`/compose/${created.id}`);
      }
      toast({ title: "Post saved", description: `Status: ${payload.status}` });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
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
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
          {isEditing ? "Edit Post" : "Compose Post"}
        </h1>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={post.title}
            onChange={(e) => setPost({ ...post, title: e.target.value })}
            placeholder="Internal title — not published"
            className="mt-1.5"
          />
        </div>

        <div>
          <Label>Platforms</Label>
          <div className="flex flex-wrap gap-2 mt-1.5">
            {platforms.map((p) => {
              const meta = platformMeta[p];
              const selected = post.platforms.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
                    selected
                      ? "text-white border-transparent"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                  )}
                  style={selected ? { backgroundColor: meta.color } : {}}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label htmlFor="base_caption">Caption</Label>
          <Textarea
            id="base_caption"
            value={post.base_caption}
            onChange={(e) => setPost({ ...post, base_caption: e.target.value })}
            placeholder="Write your post caption..."
            rows={5}
            className="mt-1.5 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">{(post.base_caption || "").length} characters</p>
        </div>

        {post.platforms.length > 1 && (
          <div className="border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => setShowOverrides(!showOverrides)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-slate-600"
            >
              Per-platform caption overrides
              {showOverrides ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showOverrides && (
              <div className="px-4 pb-4 space-y-3">
                {post.platforms.map((p: string) => (
                  <div key={p}>
                    <Label className="text-xs text-slate-500">{platformMeta[p].label}</Label>
                    <Textarea
                      value={post.caption_overrides[p] || ""}
                      onChange={(e) =>
                        setPost({
                          ...post,
                          caption_overrides: { ...post.caption_overrides, [p]: e.target.value },
                        })
                      }
                      placeholder={`Custom caption for ${platformMeta[p].label} (leave empty to use base)`}
                      rows={2}
                      className="mt-1 resize-none text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <Label>Media</Label>
          <div
            onClick={() => fileRef.current?.click()}
            className="mt-1.5 border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-300 transition-colors"
          >
            <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">
              {uploading ? "Uploading..." : "Click to upload images or videos"}
            </p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
          {post.media_urls.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {post.media_urls.map((url: string, idx: number) => (
                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeMedia(idx)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="campaign">Campaign (optional)</Label>
            <select
              id="campaign"
              value={post.campaign_id || ""}
              onChange={(e) => setPost({ ...post, campaign_id: e.target.value })}
              className="mt-1.5 w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
            >
              <option value="">No campaign</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="schedule">Schedule for (optional)</Label>
            <Input
              id="schedule"
              type="datetime-local"
              value={post.scheduled_date ? new Date(post.scheduled_date).toISOString().slice(0, 16) : ""}
              onChange={(e) =>
                setPost({ ...post, scheduled_date: e.target.value ? new Date(e.target.value).toISOString() : "" })
              }
              className="mt-1.5"
            />
          </div>
        </div>

        {post.status === "rejected" && post.approval_feedback && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-700 mb-1">Approval Feedback</p>
            <p className="text-sm text-red-600">{post.approval_feedback}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
          <Button variant="outline" onClick={() => save("draft")}>
            Save Draft
          </Button>
          <Button variant="outline" onClick={() => save("pending_approval")} className="text-amber-600 border-amber-200 hover:bg-amber-50">
            <Send className="w-4 h-4 mr-1.5" /> Submit for Approval
          </Button>
          {post.status === "pending_approval" && (
            <>
              <Button onClick={() => save("approved")} className="bg-emerald-600 hover:bg-emerald-700">
                <Check className="w-4 h-4 mr-1.5" /> Approve
              </Button>
              <Button variant="destructive" onClick={() => save("rejected")}>
                <X className="w-4 h-4 mr-1.5" /> Reject
              </Button>
            </>
          )}
          {(post.status === "approved" || post.status === "scheduled") && post.scheduled_date && (
            <Button onClick={() => save("scheduled")} className="bg-indigo-600 hover:bg-indigo-700">
              <Clock className="w-4 h-4 mr-1.5" /> Schedule
            </Button>
          )}
          <Button variant="outline" onClick={() => save("published")} className="text-green-600 border-green-200 hover:bg-green-50">
            Mark Published
          </Button>
        </div>
      </div>
    </div>
  );
}
