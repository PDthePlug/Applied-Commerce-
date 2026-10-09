"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, useAuth } from "@/lib/auth-context";
import { friendlyAuthError } from "@/lib/customer-errors";

export function AuthPanel({ compact = false }: { compact?: boolean }) {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isSupabaseConfigured()) return <div className={compact ? "auth-panel auth-panel-compact" : "auth-panel"}><div><span className="eyebrow">Account recovery</span><strong>Account access is temporarily unavailable.</strong><p>Your learning progress stays on this device. Please try again later.</p></div></div>;
  if (loading) return <p className="auth-status">Getting your account ready…</p>;
  if (user) return <div className={compact ? "auth-panel auth-panel-compact" : "auth-panel"}><div><span className="eyebrow">Account</span><strong>{user.email}</strong><p>Your account is signed in. Available workspaces depend on roles assigned to this account.</p></div><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(null); try { const { error } = await createClient().auth.signOut(); if (error) setError(friendlyAuthError(error, "We couldn’t sign you out. Please try again.")); } catch (err) { setError(friendlyAuthError(err, "We couldn’t sign you out. Please try again.")); } finally { setBusy(false); } }}>{busy ? "Signing out…" : "Sign out"}</button>{error && <p role="alert" className="auth-error">{error}</p>}</div>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
          setError("The email addresses do not match. Check both entries and try again.");
          return;
        }
        if (password !== confirmPassword) {
          setError("The passwords do not match. Please enter the same password twice.");
          return;
        }
      }

      const supabase = createClient();
      const result = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + "/auth" } });
      if (result.error) setError(friendlyAuthError(result.error));
      else if (mode === "signup" && !result.data.session) setMessage("Account created. Check the email inbox to confirm the account, then sign in.");
      else setMessage("Signed in. Available workspaces depend on access assigned to this account.");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(mode === "signin" ? "signup" : "signin");
    setConfirmEmail("");
    setConfirmPassword("");
    setError(null);
    setMessage(null);
  }

  return <div className={compact ? "auth-panel auth-panel-compact" : "auth-panel"}>
    <div>
      <span className="eyebrow">{mode === "signin" ? "Welcome back" : "Get started"}</span>
      <h2>{mode === "signin" ? "Sign in to Applied Commerce" : "Create your account"}</h2>
      <p>One account identifies a person across Applied Commerce. Learner, facilitator and workspace-administrator access is assigned separately; creating an account does not grant staff permissions.</p>
    </div>
    <form onSubmit={submit} className="auth-form">
      <label>Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      {mode === "signup" && <label>Confirm email address<input required type="email" autoComplete="email" value={confirmEmail} onChange={e => setConfirmEmail(e.target.value)} /></label>}
      <label>Password<input required minLength={8} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} /></label>
      {mode === "signup" && <label>Confirm password<input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label>}
      <button type="submit" disabled={busy}>{busy ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}</button>
    </form>
    {message && <p role="status" className="auth-success">{message}</p>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    <button type="button" className="auth-mode-switch" onClick={switchMode}>{mode === "signin" ? "New to Applied Commerce? Create an account" : "Already have an account? Sign in"}</button>
    {!compact && <Link href="/">Back to learner home</Link>}
  </div>;
}
