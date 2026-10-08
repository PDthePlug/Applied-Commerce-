"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";

export function FacilitatorRoleGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
  const [assignedUserId, setAssignedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    void createClient()
      .from("cohort_staff")
      .select("cohort_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .then(({ data, error }) => {
        if (!active) return;
        setAssignedUserId(!error && Boolean(data?.length) ? user.id : null);
        setCheckedUserId(user.id);
      });

    return () => { active = false; };
  }, [authLoading, user]);

  if (authLoading || (user && checkedUserId !== user.id)) {
    return <main className="institution-admin-page"><div className="institution-admin-state">Checking facilitator assignment…</div></main>;
  }

  if (!user) {
    return <main className="institution-admin-page"><section className="institution-admin-hero"><p className="eyebrow">Facilitator workspace</p><h1>Sign in to continue.</h1><p>Facilitator access is granted through an institution or cohort assignment.</p><Link className="institutional-primary" href="/auth">Sign in <span aria-hidden="true">→</span></Link></section></main>;
  }

  if (assignedUserId !== user.id) {
    return <main className="institution-admin-page"><section className="institution-admin-hero"><p className="eyebrow">Restricted workspace</p><h1>Facilitator access has not been assigned.</h1><p>This account can sign in, but it cannot review learner evidence or open facilitator tools until an institution administrator assigns it to a cohort.</p><Link className="institutional-text-link" href="/institutions">Back to institutions <span aria-hidden="true">→</span></Link></section></main>;
  }

  return <>{children}</>;
}
