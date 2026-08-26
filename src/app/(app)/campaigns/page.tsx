"use client";

import { useEffect, useState } from "react";
import { Post, Campaign } from "@/api/entities";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Plus, FolderKanban, Trash2 } from "lucide-react";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", description: "", color: "#4F46E5" });
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([Campaign.list(), Post.list("-created_date", 200)])
      .then(([c, p]) => {
        setCampaigns(c);
        setPosts(p);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const createCampaign = async () => {
    if (!newCampaign.name.trim()) {
      toast({ title: "Campaign name is required", variant: "destructive" });
      return;
    }
    try {
      const created = await Campaign.create(newCampaign);
      setCampaigns([...campaigns, created]);
      setNewCampaign({ name: "", description: "", color: "#4F46E5" });
      setShowForm(false);
      toast({ title: "Campaign created" });
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    }
  };

  const deleteCampaign = async (id: string) => {
    await Campaign.delete(id);
    setCampaigns(campaigns.filter((c) => c.id !== id));
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
      <PageHeader title="Campaigns" subtitle="Group and track related posts">
        <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-1.5" /> New Campaign
        </Button>
      </PageHeader>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cname">Name</Label>
              <Input id="cname" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} className="mt-1.5" placeholder="Summer Launch 2026" />
            </div>
            <div>
              <Label htmlFor="cdesc">Description</Label>
              <Input id="cdesc" value={newCampaign.description} onChange={(e) => setNewCampaign({ ...newCampaign, description: e.target.value })} className="mt-1.5" placeholder="Optional" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label>Color</Label>
            <input type="color" value={newCampaign.color} onChange={(e) => setNewCampaign({ ...newCampaign, color: e.target.value })} className="w-10 h-9 rounded cursor-pointer border border-slate-200" />
            <Button onClick={createCampaign}>Create</Button>
          </div>
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center">
          <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No campaigns yet. Create one to group related posts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const campaignPosts = posts.filter((p) => p.campaign_id === c.id);
            const published = campaignPosts.filter((p) => p.status === "published").length;
            return (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <h3 className="font-semibold text-slate-800">{c.name}</h3>
                  </div>
                  <button onClick={() => deleteCampaign(c.id)} className="text-slate-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {c.description && <p className="text-sm text-slate-500 mb-3">{c.description}</p>}
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-600">{campaignPosts.length} posts</span>
                  <span className="text-green-600">{published} published</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
