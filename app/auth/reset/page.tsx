"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage(){
  const {user,loading}=useAuth();
  const [password,setPassword]=useState("");
  const [confirmation,setConfirmation]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  if(loading)return <main className="page"><p>Checking your reset link…</p></main>;
  return <main className="page"><section className="auth-panel"><h1>Choose a new password</h1>
    {user?<form className="auth-form" onSubmit={async event=>{
      event.preventDefault();if(busy)return;
      if(password!==confirmation){setMessage("The passwords do not match.");return;}
      setBusy(true);setMessage("");
      try{
        const {error}=await createClient().auth.updateUser({password});
        if(error)throw error;
        setPassword("");setConfirmation("");setMessage("Your password has been updated.");
      }catch{setMessage("Your password could not be updated. Try again or request a new reset link.");}
      finally{setBusy(false);}
    }}>
      <label>New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <label>Confirm new password<input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={e=>setConfirmation(e.target.value)}/></label>
      <button disabled={busy} type="submit">{busy?"Updating…":"Update password"}</button>
    </form>:<p>Open the most recent password reset link from your email. If it has expired, request another link.</p>}
    {message&&<p role="status">{message}</p>}
    <Link href="/auth">Return to account access</Link>
  </section></main>;
}
