"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, useAuth } from "@/lib/auth-context";

export function AuthPanel({ compact = false }: { compact?: boolean }) {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured()) return <div className={compact ? "auth-panel auth-panel-compact" : "auth-panel"}><div><span className="eyebrow">Account recovery</span><strong>Account sync is staged for certification.</strong><p>Learning continues to save safely on this device. Account recovery will become available after the persistence certification gate.</p></div></div>;
  if (loading) return <p className="auth-status">Checking learner account…</p>;
  if (user) return <div className={compact ? "auth-panel auth-panel-compact" : "auth-panel"}><div><span className="eyebrow">Account</span><strong>{user.email}</strong><p>Your learning record can sync across devices.</p></div><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(null); const { error } = await createClient().auth.signOut(); if (error) setError(error.message); setBusy(false); }}>{busy ? "Signing out…" : "Sign out"}</button>{error && <p role="alert" className="auth-error">{error}</p>}</div>;

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(null); setMessage(null);
    const supabase = createClient();
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + "/auth" } });
    if (result.error) setError(result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("Account created. Check the email inbox to confirm the account, then sign in.");
    else setMessage("Signed in. The local learning record is now being reconciled with the account.");
    setBusy(false);
  }

  return <div className={compact ? "auth-panel auth-panel-compact" : "auth-panel"}><div><span className="eyebrow">{mode === "signin" ? "Learner account" : "Create account"}</span><h2>{mode === "signin" ? "Keep the learning record with the learner" : "Create a learner account"}</h2><p>Local work remains available on this device. An account adds recovery across devices.</p></div><form onSubmit={submit} className="auth-form"><label>Email<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input required minLength={8} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} /></label><button type="submit" disabled={busy}>{busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}</button></form>{message && <p role="status" className="auth-success">{message}</p>}{error && <p role="alert" className="auth-error">{error}</p>}<button type="button" className="auth-mode-switch" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setMessage(null); }}>{mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}</button>{!compact && <Link href="/profile">Back to learner profile</Link>}</div>;
}
