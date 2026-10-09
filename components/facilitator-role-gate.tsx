"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { FacilitatorAccessProvider } from "@/lib/facilitator/access-context";

export function FacilitatorRoleGate({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);
  const [authorizedUserId, setAuthorizedUserId] = useState<string | null>(null);
  const [cohortIds, setCohortIds] = useState<string[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [accessCheckFailed, setAccessCheckFailed] = useState(false);
  const access = useMemo(() => user ? ({ userId: user.id, isPlatformAdmin, cohortIds }) : null, [user?.id, isPlatformAdmin, cohortIds]);

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    const supabase = createClient();

    void Promise.all([
      supabase.rpc("is_platform_admin"),
      supabase
        .from("cohort_staff")
        .select("cohort_id")
        .eq("user_id", user.id)
        .eq("status", "active"),
    ]).then(([adminResult, staffResult]) => {
      if (!active) return;
      // Fail closed on either authorization lookup error. The global bypass is
      // granted only by the database's platform-admin registry, never UI metadata.
      const lookupFailed = Boolean(adminResult.error || staffResult.error);
      const platformAdmin = !adminResult.error && adminResult.data === true;
      const assignedCohortIds = !staffResult.error
        ? [...new Set((staffResult.data ?? []).map((row) => row.cohort_id))]
        : [];
      setAccessCheckFailed(lookupFailed);
      setIsPlatformAdmin(platformAdmin);
      setCohortIds(assignedCohortIds);
      setAuthorizedUserId(!lookupFailed && (platformAdmin || assignedCohortIds.length > 0) ? user.id : null);
      setCheckedUserId(user.id);
    }).catch(() => {
      if (!active) return;
      setAccessCheckFailed(true);
      setAuthorizedUserId(null);
      setCheckedUserId(user.id);
    });

    return () => {
      active = false;
    };
  }, [authLoading, user]);

  if (authLoading || (user && checkedUserId !== user.id)) {
    return <main className="institution-admin-page"><div className="institution-admin-state">Getting your facilitator workspace ready…</div></main>;
  }

  if (!user) {
    return <main className="institution-admin-page"><section className="institution-admin-hero"><p className="eyebrow">Facilitator workspace</p><h1>Sign in to continue.</h1><p>Facilitator access is granted through an institution or cohort assignment.</p><Link className="institutional-primary" href="/auth">Sign in <span aria-hidden="true">→</span></Link></section></main>;
  }

  if (authorizedUserId !== user.id && accessCheckFailed) {
    return <main className="institution-admin-page"><section className="institution-admin-hero"><p className="eyebrow">Facilitator workspace</p><h1>We couldn’t confirm access just now.</h1><p>Please refresh and try again. If the problem continues, contact your institution administrator.</p></section></main>;
  }

  if (authorizedUserId !== user.id) {
    return <main className="institution-admin-page"><section className="institution-admin-hero"><p className="eyebrow">Restricted workspace</p><h1>Facilitator access has not been assigned.</h1><p>This account can sign in, but it cannot review learner evidence or open facilitator tools until an institution administrator assigns it to a cohort.</p><Link className="institutional-text-link" href="/institutions">Back to institutions <span aria-hidden="true">→</span></Link></section></main>;
  }

  return access ? <FacilitatorAccessProvider value={access}>{children}</FacilitatorAccessProvider> : <>{children}</>;
}
