"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured, useAuth } from "@/lib/auth-context";
import { friendlyAuthError } from "@/lib/customer-errors";

export function AuthPanel({ compact = false }: { compact?: boolean }) {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "recovery">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const Heading=compact?"h2":"h1";

  if (!isSupabaseConfigured()) return <div className={compact ? "auth-panel auth-panel-compact" : "auth-panel"}><div><span className="eyebrow">Account recovery</span><Heading>Account access is temporarily unavailable.</Heading><p>Your learning progress stays on this device. Please try again later.</p></div></div>;
  if (loading) return <p className="auth-status">Getting your account ready…</p>;
  if (user) return <div className={compact ? "auth-panel auth-panel-compact" : "auth-panel"}><div><span className="eyebrow">Account</span><Heading>Your account</Heading><strong>{user.email}</strong><p>Your account is signed in. Available workspaces depend on roles assigned to this account.</p></div><button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(null); try { const { error } = await createClient().auth.signOut(); if (error) setError(friendlyAuthError(error, "We couldn’t sign you out. Please try again.")); } catch (err) { setError(friendlyAuthError(err, "We couldn’t sign you out. Please try again.")); } finally { setBusy(false); } }}>{busy ? "Signing out…" : "Sign out"}</button>{error && <p role="alert" className="auth-error">{error}</p>}</div>;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          setError("The passwords do not match. Please enter the same password twice.");
          return;
        }
      }

      const supabase = createClient();
      if(mode==="recovery"){
        const {error}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+"/auth/callback?next=/auth/reset"});
        if(error)setError(friendlyAuthError(error));
        else setMessage("If this email has an account, a password reset link will arrive shortly.");
        return;
      }
      const result = mode === "signin"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin + "/auth/callback" } });
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
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setMessage(null);
  }

  return <div className={compact ? "auth-panel auth-panel-compact" : "auth-panel"}>
    <div>
      <span className="eyebrow">{mode === "signin" ? "Welcome back" : "Get started"}</span>
      <Heading>{mode === "recovery"?"Reset your password":mode === "signin" ? "Sign in to Applied Commerce" : "Create your account"}</Heading>
      <p>{mode==="recovery"?"Enter your account email to receive a reset link.":mode === "signin" ? "Use your Applied Commerce account to continue." : "Create your account. Staff access is assigned separately."}</p>
    </div>
    <form onSubmit={submit} className="auth-form">
      <label>Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
      {mode!=="recovery"&&<label>Password<input required minLength={mode==="signup"?8:undefined} type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} /></label>}
      {mode === "signup" && <label>Confirm password<input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} /></label>}
      <button type="submit" disabled={busy}>{busy ? "Working…" : mode==="recovery"?"Send reset link":mode === "signin" ? "Sign in" : "Create account"}</button>
    </form>
    {message && <p role="status" className="auth-success">{message}</p>}
    {error && <p role="alert" className="auth-error">{error}</p>}
    <button type="button" className="auth-mode-switch" onClick={switchMode}>{mode === "signin" ? "New to Applied Commerce? Create an account" : "Already have an account? Sign in"}</button>
    {mode==="signin"&&<button type="button" className="auth-mode-switch" onClick={()=>{setMode("recovery");setPassword("");setError(null);setMessage(null);}}>Forgot your password?</button>}
  </div>;
}
