"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart3, CheckCircle2, FileCheck2, RefreshCw, TriangleAlert, UsersRound } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { loadInstitutionalReport, type InstitutionalReport } from "@/lib/institutional/reporting";
import styles from "@/app/institution-reporting/institution-reporting.module.css";

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load the institutional report.";
}

export function InstitutionalReporting() {
  const { user, loading: authLoading } = useAuth();
  const [report, setReport] = useState<InstitutionalReport | null>(null);
  const [schoolId, setSchoolId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (targetSchoolId?: string) => {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const supabase = (await import("@/lib/supabase/client")).createClient();
      const { data: memberships, error: membershipError } = await supabase.from("school_memberships")
        .select("school_id").eq("user_id", user.id).in("role", ["owner", "admin"]).eq("status", "active");
      if (membershipError) throw membershipError;
      const ids = [...new Set((memberships ?? []).map(row => row.school_id))];
      const nextId = targetSchoolId && ids.includes(targetSchoolId) ? targetSchoolId : (schoolId && ids.includes(schoolId) ? schoolId : ids[0] ?? "");
      if (!nextId) {
        setReport(null);
        setSchoolId("");
        return;
      }
      const nextReport = await loadInstitutionalReport(user.id, nextId);
      setReport(nextReport);
      setSchoolId(nextId);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }, [schoolId, user]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load, user]);

  const attention = useMemo(() => [...(report?.learners ?? [])]
    .sort((a, b) => (b.needsRevision - a.needsRevision) || (a.completionRate - b.completionRate))
    .slice(0, 8), [report]);

  if (authLoading) return <main className={styles.page}><div className={styles.empty}>Checking account access…</div></main>;
  if (!user) return <main className={styles.page}><div className={styles.empty}><BarChart3/><h1>Institution reporting</h1><p>Sign in with an institution administrator account to view operational reporting.</p><Link href="/auth">Sign in</Link></div></main>;

  return <main className={styles.page}>
    <header className={styles.hero}>
      <div>
        <Link className={styles.back} href="/institution-admin"><ArrowLeft/> Institution administration</Link>
        <p className={styles.eyebrow}>Milestone 8 · Institutional visibility</p>
        <h1>{report?.school.name ?? "Institution reporting"}</h1>
        <p>Turn the same durable learner, cohort and evidence records into an operational view for programme decisions.</p>
      </div>
      <button className={styles.refresh} onClick={() => void load(schoolId)} disabled={busy}><RefreshCw/> {busy ? "Refreshing…" : "Refresh"}</button>
    </header>

    {error ? <div className={styles.alert}>{error}</div> : null}

    {!report ? <section className={styles.empty}><BarChart3/><h2>No institution available</h2><p>This account is not an active school owner/admin, or the institution has not been provisioned yet.</p><Link href="/institution-admin">Open institution administration</Link></section> : <>
      <section className={styles.metrics}>
        <Metric icon={UsersRound} value={report.totals.learners} label="Learners" />
        <Metric icon={BarChart3} value={report.totals.cohorts} label="Cohorts" />
        <Metric icon={FileCheck2} value={report.totals.evidence} label="Evidence captured" />
        <Metric icon={CheckCircle2} value={report.totals.completionRate + "%"} label="Lesson completion" />
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <header><div><p className={styles.eyebrow}>Cohort pulse</p><h2>Programme delivery</h2></div><span>{report.cohorts.length}</span></header>
          {report.cohorts.length ? <div className={styles.cohorts}>{report.cohorts.map(cohort => <article key={cohort.id}>
            <div className={styles.cohortTop}><div><strong>{cohort.name}</strong><small>Grade {cohort.grade} · {cohort.academicYear}</small></div><b>{cohort.completionRate}%</b></div>
            <div className={styles.bar}><i style={{ width: cohort.completionRate + "%" }} /></div>
            <div className={styles.cohortStats}><span>{cohort.learnerCount} learners</span><span>{cohort.evidenceCount} evidence</span><span>{cohort.needsRevision} revision</span><span>{cohort.verified} verified</span></div>
          </article>)}</div> : <p className={styles.muted}>No cohorts have been created yet.</p>}
        </article>

        <article className={styles.card}>
          <header><div><p className={styles.eyebrow}>Attention</p><h2>Learners to look at</h2></div><TriangleAlert/></header>
          {attention.length ? <div className={styles.attention}>{attention.map(learner => <article key={learner.id}>
            <div><strong>{learner.name}</strong><small>{learner.cohortName} · Grade {learner.grade}</small></div>
            <span>{learner.completionRate}%</span>
            <em className={learner.needsRevision ? styles.warn : ""}>{learner.needsRevision ? learner.needsRevision + " revision" : "On track"}</em>
          </article>)}</div> : <p className={styles.muted}>No learner attention signals yet. This is a genuine zero-state, not synthetic reporting data.</p>}
        </article>
      </section>

      <section className={styles.card}>
        <header><div><p className={styles.eyebrow}>Evidence pipeline</p><h2>What the institution can observe</h2><p className={styles.muted}>These measures come from persisted learner activity and facilitator decisions. They do not infer internal traits.</p></div></header>
        <div className={styles.pipeline}><div><strong>{report.totals.evidence}</strong><span>captured</span></div><div><strong>{report.totals.reviewed}</strong><span>reviewed</span></div><div><strong>{report.totals.needsRevision}</strong><span>needs revision</span></div><div><strong>{report.totals.verified}</strong><span>verified</span></div></div>
      </section>

      <footer className={styles.note}>Operational reporting is intentionally derived from the existing school → cohort → learner → evidence chain. No separate reporting database or parallel institutional model is introduced.</footer>
    </>}
  </main>;
}

function Metric({ icon: Icon, value, label }: { icon: typeof UsersRound; value: number | string; label: string }) {
  return <article className={styles.metric}><Icon/><strong>{value}</strong><span>{label}</span></article>;
}
