"use client";

import { useEffect, useState } from "react";
import { User } from "@/api/entities";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Mail, Shield, User as UserIcon } from "lucide-react";

export default function TeamSettings() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const { toast } = useToast();

  const loadUsers = () => {
    User.list().then(setUsers).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // NOTE: no email invite backend yet — this creates the member record directly.
  // Swap for a real invite flow once auth is wired up.
  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({ title: "Enter an email address", variant: "destructive" });
      return;
    }
    setInviting(true);
    try {
      await User.create({ email: inviteEmail, role: inviteRole });
      toast({ title: "Member added", description: inviteEmail });
      setInviteEmail("");
      loadUsers();
    } catch (e: any) {
      toast({ title: "Failed to add member", description: e.message, variant: "destructive" });
    } finally {
      setInviting(false);
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
    <div className="p-6 md:p-8 max-w-3xl">
      <PageHeader title="Team" subtitle="Manage who has access and their roles" />

      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="font-semibold text-slate-800 mb-1">Add a teammate</h2>
        <p className="text-sm text-slate-500 mb-4">Creates a member record. Email invites come with real auth.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@email.com"
              className="pl-9"
            />
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
          >
            <option value="user">Member (draft only)</option>
            <option value="admin">Approver (full access)</option>
          </select>
          <Button onClick={handleInvite} disabled={inviting} className="bg-indigo-600 hover:bg-indigo-700">
            <UserPlus className="w-4 h-4 mr-1.5" /> {inviting ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Team Members ({users.length})</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-sm font-medium">
                  {u.email?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{u.email}</p>
                  <p className="text-xs text-slate-400">{u.name || "No name set"}</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full border border-slate-200 text-slate-600">
                {u.role === "admin" ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                {u.role === "admin" ? "Approver" : "Member"}
              </span>
            </div>
          ))}
          {users.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-slate-400">No team members yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
