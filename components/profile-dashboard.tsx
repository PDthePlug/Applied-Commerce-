"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, BookOpen, Building2, ChevronRight, GraduationCap, Settings2, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLearningStore } from "@/lib/learning-store";

export function ProfileDashboard() {
  const { user, loading } = useAuth();
  const { state } = useLearningStore();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [workspaceAccess, setWorkspaceAccess] = useState({ facilitator: false, institution: false });
  const [workspacesReady, setWorkspacesReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { setWorkspaceAccess({ facilitator: false, institution: false }); setWorkspacesReady(true); return; }
    let active = true;
    setWorkspacesReady(false);
    void Promise.all([
      createClient().rpc("is_platform_admin"),
      createClient().from("cohort_staff").select("cohort_id").eq("user_id", user.id).eq("status", "active"),
      createClient().from("school_memberships").select("role").eq("user_id", user.id).eq("status", "active"),
    ]).then(([admin, facilitator, institution]) => {
      if (!active) return;
      if (admin.error || facilitator.error || institution.error) {
        setWorkspaceAccess({ facilitator: false, institution: false });
      } else {
        const isAdmin = admin.data === true;
        setWorkspaceAccess({
          facilitator: isAdmin || (facilitator.data?.length ?? 0) > 0,
          institution: isAdmin || (institution.data ?? []).some(item => item.role === "owner" || item.role === "admin"),
        });
      }
      setWorkspacesReady(true);
    }).catch(() => {
      if (!active) return;
      setWorkspaceAccess({ facilitator: false, institution: false });
      setWorkspacesReady(true);
    });
    return () => { active = false; };
  }, [loading, user?.id]);

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

    {workspacesReady && (workspaceAccess.facilitator || workspaceAccess.institution) ? <section className="profile-hub-section" aria-labelledby="profile-hub-workspaces">
      <h2 id="profile-hub-workspaces">Workspaces</h2>
      <div className="profile-hub-list">
        {workspaceAccess.facilitator ? <Link href="/facilitator" className="profile-hub-row"><span className="profile-hub-row-icon"><GraduationCap aria-hidden="true"/></span><span className="profile-hub-row-copy"><strong>Facilitator workspace</strong><small>Review learner progress and evidence</small></span><ChevronRight aria-hidden="true" className="profile-hub-chevron"/></Link> : null}
        {workspaceAccess.institution ? <Link href="/institutions/manage" className="profile-hub-row"><span className="profile-hub-row-icon"><Building2 aria-hidden="true"/></span><span className="profile-hub-row-copy"><strong>Institution operations</strong><small>Manage assigned institution access</small></span><ChevronRight aria-hidden="true" className="profile-hub-chevron"/></Link> : null}
      </div>
    </section> : null}

    <section className="profile-hub-section" aria-labelledby="profile-hub-account">
      <h2 id="profile-hub-account">Account</h2>
      <div className="profile-hub-account">
        <div><span>Email address</span><strong>{user?.email ?? (loading ? "Checking account…" : "Not signed in")}</strong></div>
        {user ? <button type="button" onClick={() => void signOut()} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button> : <Link href="/auth">Sign in</Link>}
      </div>
      {signOutError ? <p className="profile-hub-error" role="alert">{signOutError}</p> : null}
    </section>
    <p className="profile-hub-footnote"><UserRound aria-hidden="true"/> Your saved responses and lesson completion are not changed by presentation settings.</p>
  </main>;
}
