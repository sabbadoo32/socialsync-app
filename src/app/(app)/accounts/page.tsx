"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, Link2, Trash2 } from "lucide-react";

export default function Accounts() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [handle, setHandle] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [connecting, setConnecting] = useState(false);

  const load = () => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => setAccounts(d.accounts || []))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const bluesky = accounts.find((a) => a.platform === "bluesky");

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    try {
      const res = await fetch("/api/platforms/bluesky/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: handle.trim(), appPassword: appPassword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Connection failed");
      toast({ title: "Bluesky connected", description: `@${data.handle}` });
      setHandle("");
      setAppPassword("");
      load();
    } catch (err: any) {
      toast({ title: "Couldn't connect", description: err.message, variant: "destructive" });
    } finally {
      setConnecting(false);
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Bluesky? Scheduled posts to Bluesky will stop publishing.")) return;
    await fetch("/api/accounts?platform=bluesky", { method: "DELETE" });
    load();
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <PageHeader title="Connected Accounts" subtitle="Connect the accounts your scheduled posts publish to" />

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: "#1185FE" }}>
            BS
          </span>
          <h2 className="font-semibold text-slate-800">Bluesky</h2>
          {bluesky && (
            <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" /> Connected
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-slate-400 mt-3">Loading…</p>
        ) : bluesky ? (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Posting as{" "}
              <span className="font-medium">@{(bluesky.metadata?.handle) || bluesky.platformUserId}</span>
            </p>
            <Button variant="outline" size="sm" onClick={disconnect} className="text-red-600 border-red-200 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-1.5" /> Disconnect
            </Button>
          </div>
        ) : (
          <form onSubmit={connect} className="mt-3 space-y-3">
            <p className="text-sm text-slate-500">
              Use an <span className="font-medium">App Password</span> (Bluesky → Settings → Privacy &amp; Security →
              App Passwords), not your login password.
            </p>
            <div>
              <Label htmlFor="handle">Handle</Label>
              <Input id="handle" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="michiganunited.bsky.social" className="mt-1.5" required />
            </div>
            <div>
              <Label htmlFor="app">App Password</Label>
              <Input id="app" type="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} placeholder="xxxx-xxxx-xxxx-xxxx" className="mt-1.5" required />
            </div>
            <Button type="submit" disabled={connecting} className="bg-indigo-600 hover:bg-indigo-700">
              <Link2 className="w-4 h-4 mr-1.5" /> {connecting ? "Connecting…" : "Connect Bluesky"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
