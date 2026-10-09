"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, BookOpen, ChevronRight, Settings2, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLearningStore } from "@/lib/learning-store";

export function ProfileDashboard() {
  const { user, loading } = useAuth();
  const { state } = useLearningStore();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");

  const displayName = state.profile?.displayName?.trim()
    || (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "")
    || (typeof user?.user_metadata?.name === "string" ? user.user_metadata.name : "")
    || user?.email?.split("@")[0]
    || "Learner";
  const grade = state.profile?.grade ?? state.activeGrade ?? 8;

  async function signOut() {
    setSigningOut(true); setSignOutError("");
    try {
      const result = await createClient().auth.signOut();
      if (result.error) throw result.error;
      router.push("/auth");
      router.refresh();
    } catch {
      setSignOutError("Sign out could not be completed. Please try again.");
    } finally { setSigningOut(false); }
  }

  const rows = [
    { href: "/settings", title: "Settings", detail: "Profile, appearance, reading and account security", Icon: Settings2 },
    { href: "/learn", title: "Learning", detail: `Continue your Grade ${grade} learning journey`, Icon: BookOpen },
    { href: "/portfolio", title: "Portfolio", detail: "Review saved learning evidence", Icon: Archive },
  ];

  return <main className="profile-hub">
    <section className="profile-hub-identity">
      <div className="profile-hub-avatar" aria-hidden="true">{displayName.split(/\s+/).slice(0,2).map(part => part[0]?.toUpperCase() ?? "").join("") || "AC"}</div>
      <div className="profile-hub-title">
        <p className="eyebrow">My Applied Commerce</p>
        <h1>{displayName}</h1>
        <p>{user?.email ?? `Grade ${grade} learner`}</p>
      </div>
    </section>

    <section className="profile-hub-section" aria-labelledby="profile-hub-learning">
      <h2 id="profile-hub-learning">Your learning space</h2>
      <div className="profile-hub-list">
        {rows.map(({href,title,detail,Icon}) => <Link href={href} className="profile-hub-row" key={href}>
          <span className="profile-hub-row-icon"><Icon aria-hidden="true"/></span>
          <span className="profile-hub-row-copy"><strong>{title}</strong><small>{detail}</small></span>
          <ChevronRight aria-hidden="true" className="profile-hub-chevron"/>
        </Link>)}
      </div>
    </section>

    <section className="profile-hub-section" aria-labelledby="profile-hub-account">
      <h2 id="profile-hub-account">Account</h2>
      <div className="profile-hub-account">
        <div><span>Email address</span><strong>{user?.email ?? (loading ? "Checking account…" : "Not signed in")}</strong></div>
        {user ? <button type="button" onClick={() => void signOut()} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button> : <Link href="/auth">Sign in</Link>}
      </div>
      {signOutError ? <p className="profile-hub-error" role="alert">{signOutError}</p> : null}
    </section>
    <p className="profile-hub-footnote"><UserRound aria-hidden="true"/> Account preferences are private to this account. Learning evidence and progress remain separate from presentation settings.</p>
  </main>;
}
