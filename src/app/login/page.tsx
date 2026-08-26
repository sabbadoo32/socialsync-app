"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, CheckCircle } from "lucide-react";

function LoginInner() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "not_registered"
      ? "That email isn't on the team yet. Ask an admin to add you."
      : null
  );

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white">P</div>
          <span className="font-bold text-slate-800 text-xl tracking-tight">Postly</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h1 className="font-semibold text-slate-800 mb-1">Check your email</h1>
              <p className="text-sm text-slate-500">
                We sent a login link to <span className="font-medium">{email}</span>. Click it to sign in.
              </p>
            </div>
          ) : (
            <form onSubmit={sendLink}>
              <h1 className="font-semibold text-slate-800 text-lg mb-1">Sign in</h1>
              <p className="text-sm text-slate-500 mb-5">Enter your team email — we'll send you a login link.</p>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1.5 mb-4">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@team.com"
                  className="pl-9"
                />
              </div>
              {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {loading ? "Sending..." : "Send login link"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
