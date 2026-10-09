"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, CheckCircle2, GraduationCap, Plus, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { friendlyActionError } from "@/lib/customer-errors";
import { InstitutionWorkspaceMenu } from "./institution-workspace-menu";
import {
  addCohortStaff,
  addInstitutionMember,
  createInstitution,
  createInstitutionCohort,
  enrolLearner,
  loadCohortPeople,
  loadCohortLearningInsights,
  loadInstitutionalContext,
  type Cohort,
  type CohortLearningInsights,
  type School
} from "@/lib/institutional/provisioning";

type Membership = { school_id: string; role: string; status: string };
type StaffPerson = { user_id: string; role: string; status: string; profile: { id: string; display_name: string | null; status: string } | null };
type InstitutionSection = "overview" | "cohorts" | "learners" | "facilitators" | "team";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function messageFor(error: unknown) {
  return friendlyActionError(error);
}

export function InstitutionalAdmin({ initialSection = "overview" }: { initialSection?: InstitutionSection } = {}) {
  const { user, loading: authLoading } = useAuth();
  const pageSection = initialSection;
  const [schools, setSchools] = useState<School[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextLoadFailed, setContextLoadFailed] = useState(false);
  const [schoolId, setSchoolId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [people, setPeople] = useState<{ learners: Array<{ learner_id: string; status: string; profile: { id: string; display_name: string | null; status: string } | null }>; staff: StaffPerson[]; staffIds: string[] } | null>(null);
  const [cohortInsights, setCohortInsights] = useState<CohortLearningInsights | null>(null);
  const [cohortInsightsLoading, setCohortInsightsLoading] = useState(false);
  const [cohortInsightsUnavailable, setCohortInsightsUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [schoolName, setSchoolName] = useState("");
  const [schoolSlug, setSchoolSlug] = useState("");
  const [cohortName, setCohortName] = useState("");
  const [cohortGrade, setCohortGrade] = useState(8);
  const [cohortYear, setCohortYear] = useState(new Date().getFullYear());
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"admin" | "educator">("educator");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState<"lead" | "educator" | "assistant">("educator");
  const [learnerEmail, setLearnerEmail] = useState("");

  const membership = useMemo(() => memberships.find((item) => item.school_id === schoolId), [memberships, schoolId]);
  const isAdmin = isPlatformAdmin || membership?.role === "owner" || membership?.role === "admin";
  const hasInstitutionAdminAccess = isPlatformAdmin || memberships.some((item) => item.status === "active" && (item.role === "owner" || item.role === "admin"));
  const selectedCohort = cohorts.find((item) => item.id === cohortId);
  const isCohortStaff = Boolean(user && people?.staffIds.includes(user.id));
  const canManageLearners = Boolean(isAdmin || isCohortStaff);

  async function refresh(preferredSchoolId?: string, preferredCohortId?: string) {
    if (!user) return;
    const context = await loadInstitutionalContext(user.id);
    setContextLoadFailed(false);
    setIsPlatformAdmin(context.isPlatformAdmin);
    setContextLoading(false);
    setSchools(context.schools);
    setMemberships(context.memberships as Membership[]);
    const nextSchoolId = preferredSchoolId && context.schools.some((item) => item.id === preferredSchoolId)
      ? preferredSchoolId
      : schoolId && context.schools.some((item) => item.id === schoolId)
        ? schoolId
        : context.selectedSchoolId;
    setSchoolId(nextSchoolId);
    const schoolCohorts = context.cohorts.filter((item) => item.school_id === nextSchoolId);
    setCohorts(context.cohorts);
    const nextCohortId = preferredCohortId && schoolCohorts.some((item) => item.id === preferredCohortId)
      ? preferredCohortId
      : cohortId && schoolCohorts.some((item) => item.id === cohortId)
        ? cohortId
        : schoolCohorts[0]?.id ?? "";
    setCohortId(nextCohortId);
    if (nextCohortId) {
      setPeople(await loadCohortPeople(nextCohortId));
    } else {
      setPeople(null);
    }
  }

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let cancelled = false;

    async function load(authenticatedUserId: string) {
      try {
        const context = await loadInstitutionalContext(authenticatedUserId);
        if (cancelled) return;
        setContextLoadFailed(false);
        setIsPlatformAdmin(context.isPlatformAdmin);
        setContextLoading(false);
        setSchools(context.schools);
        setMemberships(context.memberships as Membership[]);
        setCohorts(context.cohorts);
        setSchoolId(context.selectedSchoolId);
        const firstCohort = context.cohorts.find((item) => item.school_id === context.selectedSchoolId);
        setCohortId(firstCohort?.id ?? "");
      } catch (err) {
        if (!cancelled) { setError(messageFor(err)); setContextLoadFailed(true); setContextLoading(false); }
      }
    }

    void load(userId);
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!cohortId) return;
    let cancelled = false;

    void loadCohortPeople(cohortId)
      .then((value) => {
        if (!cancelled) setPeople(value);
      })
      .catch((err) => {
        if (!cancelled) setError(messageFor(err));
      });

    return () => { cancelled = true; };
  }, [cohortId]);

  useEffect(() => {
    if (!cohortId || (pageSection !== "overview" && pageSection !== "cohorts")) return;
    let cancelled = false;
    void Promise.resolve().then(() => {
      if (!cancelled) { setCohortInsightsLoading(true); setCohortInsightsUnavailable(false); }
      return loadCohortLearningInsights(cohortId);
    }).then(value => { if (!cancelled) setCohortInsights(value); })
      .catch(() => { if (!cancelled) { setCohortInsights(null); setCohortInsightsUnavailable(true); } })
      .finally(() => { if (!cancelled) setCohortInsightsLoading(false); });
    return () => { cancelled = true; };
  }, [cohortId, pageSection]);

  const schoolCohorts = cohorts.filter((item) => item.school_id === schoolId);

  async function run(action: () => Promise<void>, success: string, after?: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      if (after) await after();
      setNotice(success);
    } catch (err) {
      setError(messageFor(err));
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return <main className="institution-admin-page"><div className="institution-admin-state">Getting your account ready…</div></main>;
  }

  if (!user) {
    return (
      <main className="institution-admin-page">
        <section className="institution-admin-hero">
          <p className="eyebrow">Institution operations</p>
          <h1>Set up the delivery layer behind the learner experience.</h1>
          <p>Sign in to create or manage schools, cohorts, educators and learner enrolments.</p>
          <Link className="institutional-primary" href="/auth">Sign in to continue <ArrowRight /></Link>
        </section>
      </main>
    );
  }

  if (contextLoading) {
    return <main className="institution-admin-page"><div className="institution-admin-state">Getting your institution workspace ready…</div></main>;
  }

  if (contextLoadFailed) {
    return <main className="institution-admin-page"><section className="institution-admin-hero"><p className="eyebrow">Institution workspace</p><h1>We couldn’t confirm your access just now.</h1><p>Please refresh and try again. If the problem continues, contact your platform administrator.</p><button type="button" className="institutional-primary" onClick={() => window.location.reload()}>Try again <ArrowRight /></button></section></main>;
  }

  if (!hasInstitutionAdminAccess) {
    return <main className="institution-admin-page"><section className="institution-admin-hero"><p className="eyebrow">Restricted workspace</p><h1>Institution administrator access required.</h1><p>Signing in creates an account, but it does not grant institution-management permissions. Ask a platform or institution administrator to assign the appropriate role.</p><Link className="institutional-text-link" href="/institutions">Back to institutions <ArrowRight /></Link></section></main>;
  }

  return (
    <main className="institution-admin-page" data-workspace-section={pageSection}>
      <header className="institution-admin-header">
        <div>
          <p className="eyebrow">Applied Commerce · Institutional operations</p>
          <h1>{pageSection === "overview" ? (isPlatformAdmin ? "Platform administration." : "Institution home.") : pageSection === "cohorts" ? "Cohorts & delivery groups." : pageSection === "learners" ? "Learner enrolment." : pageSection === "facilitators" ? "Facilitator assignments." : "Institution team access."}</h1>
          <p>{pageSection === "overview" ? "A dedicated home for school setup, cohort delivery and role assignments." : pageSection === "cohorts" ? "Create and manage the cohorts that structure programme delivery." : pageSection === "learners" ? "Assign learners by email before or after registration." : pageSection === "facilitators" ? "Assign facilitators to the right school and cohort." : "Manage school-level administrator and educator access."}</p>
        </div>
        <Link className="institution-admin-secondary" href="/facilitator">Open facilitator workspace <ArrowRight /></Link>
      </header>
      <InstitutionWorkspaceMenu isPlatformAdmin={isPlatformAdmin} />

      {error ? <div className="institution-admin-alert error"><span>{error}</span></div> : null}
      {notice ? <div className="institution-admin-alert success"><CheckCircle2 /><span>{notice}</span></div> : null}

      {!schools.length ? (
        <section className="institution-admin-card institution-admin-bootstrap">
          <div className="institution-admin-icon"><Building2 /></div>
          <div>
            <p className="eyebrow">First institution</p>
            <h2>Create the school record</h2>
            <p>This creates an institution in the existing production model. Institution administrators are assigned separately; global authority is never granted by creating an institution.</p>
            <form onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                const created = await createInstitution(schoolName, schoolSlug || slugify(schoolName));
                setSchoolName("");
                setSchoolSlug("");
                await refresh(created.id);
              }, "School created.");
            }}>
              <div className="institution-admin-form-grid">
                <label><span>School / institution name</span><input required value={schoolName} onChange={(event) => { setSchoolName(event.target.value); if (!schoolSlug) setSchoolSlug(slugify(event.target.value)); }} placeholder="e.g. Applied Commerce Academy" /></label>
                <label><span>Slug</span><input required value={schoolSlug} onChange={(event) => setSchoolSlug(event.target.value)} placeholder="applied-commerce-academy" /></label>
              </div>
              <button className="institutional-primary" disabled={busy || !schoolName.trim() || !schoolSlug.trim()}><Plus /> Create institution</button>
            </form>
          </div>
        </section>
      ) : (
        <>
          <section className="institution-admin-toolbar">
            <label><span>Institution</span><select value={schoolId} onChange={(event) => { setSchoolId(event.target.value); const next = cohorts.filter((item) => item.school_id === event.target.value)[0]; setCohortId(next?.id ?? ""); }}>{schools.map((school) => <option value={school.id} key={school.id}>{school.name}</option>)}</select></label>
            {(pageSection === "learners" || pageSection === "facilitators") ? <label><span>Course / cohort</span><select value={cohortId} onChange={(event) => setCohortId(event.target.value)}>{schoolCohorts.map((cohort) => <option value={cohort.id} key={cohort.id}>{cohort.name}</option>)}</select></label> : null}
            <div className="institution-admin-role"><ShieldCheck /><span>{isPlatformAdmin ? "System administrator" : membership?.role ?? "member"}</span></div>
          </section>

          <section className="institution-admin-metrics" data-workspace-section="overview">
            <article><Building2 /><strong>{schools.length}</strong><span>Institution{schools.length === 1 ? "" : "s"}</span></article>
            <article><UsersRound /><strong>{schoolCohorts.length}</strong><span>Active cohorts</span></article>
            <article><GraduationCap /><strong>{people?.learners.length ?? 0}</strong><span>Learners in selected cohort</span></article>
            <article><UserPlus /><strong>{people?.staff.length ?? 0}</strong><span>Cohort staff</span></article>
          </section>

          {(pageSection === "overview" || pageSection === "cohorts") && selectedCohort ? <section className="institution-admin-card" data-workspace-section="overview cohorts">
            <header><div><p className="eyebrow">Cohort learning pulse</p><h2>Learning and evidence coverage</h2></div><span>Aggregate view</span></header>
            {cohortInsightsLoading ? <p className="institution-admin-empty">Preparing cohort learning summary…</p> : cohortInsightsUnavailable ? <p className="institution-admin-empty">The cohort learning summary is temporarily unavailable. Refresh to try again.</p> : cohortInsights?.suppressed ? <p className="institution-admin-empty">Privacy protection is active. Learning metrics appear when at least five learners have contributed, so this view does not expose an individual learner’s activity.</p> : cohortInsights ? <>
              <p>Summary across {cohortInsights.learnerCount} learners. Individual answers and learner-level scores are not shown here.</p>
              <div className="institution-admin-metrics">
                <article><GraduationCap /><strong>{cohortInsights.completedLessons}</strong><span>Lessons completed</span></article>
                <article><CheckCircle2 /><strong>{cohortInsights.savedResponses}</strong><span>Saved activity responses</span></article>
                <article><ShieldCheck /><strong>{cohortInsights.reviewCoverage}%</strong><span>Evidence review coverage</span></article>
                <article><UsersRound /><strong>{cohortInsights.needsRevision}</strong><span>Items needing revision</span></article>
              </div>
              <p className="institution-admin-empty">These are coverage indicators, not a ranking of learners or a claim of competency. Capability conclusions require reviewed evidence across contexts.</p>
            </> : <p className="institution-admin-empty">Select a cohort to see its learning summary.</p>}
          </section> : null}

          <div className="institution-admin-grid">
            <section className="institution-admin-card" data-workspace-section="overview cohorts">
              <header><div><p className="eyebrow">Cohorts</p><h2>Programme delivery groups</h2></div><span>{schoolCohorts.length}</span></header>
              <div className="institution-admin-list">
                {schoolCohorts.map((cohort) => <button key={cohort.id} className={cohort.id === cohortId ? "active" : ""} onClick={() => setCohortId(cohort.id)}>
                  <span><strong>{cohort.name}</strong><small>Grade {cohort.grade} · {cohort.academic_year} · {cohort.status}</small></span>
                  <ArrowRight />
                </button>)}
                {!schoolCohorts.length ? <p className="institution-admin-empty">No cohorts yet. Create the first delivery group below.</p> : null}
              </div>
              {isAdmin ? <form className="institution-admin-form" onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  const created = await createInstitutionCohort({ schoolId, name: cohortName, grade: cohortGrade, academicYear: cohortYear });
                  setCohortName("");
                  await refresh(schoolId, created.id);
                }, "Cohort created.");
              }}>
                <p className="eyebrow">Create cohort</p>
                <label><span>Name</span><input required value={cohortName} onChange={(event) => setCohortName(event.target.value)} placeholder="Grade 10 · 2026" /></label>
                <div className="institution-admin-form-grid">
                  <label><span>Grade</span><select value={cohortGrade} onChange={(event) => setCohortGrade(Number(event.target.value))}>{[8,9,10,11,12].map((grade) => <option value={grade} key={grade}>Grade {grade}</option>)}</select></label>
                  <label><span>Academic year</span><input type="number" min="2020" max="2100" value={cohortYear} onChange={(event) => setCohortYear(Number(event.target.value))} /></label>
                </div>
                <button className="institutional-primary" disabled={busy || !cohortName.trim()}><Plus /> Create cohort</button>
              </form> : null}
            </section>

            <section className="institution-admin-card" data-workspace-section="overview learners facilitators">
              <header><div><p className="eyebrow">Selected cohort</p><h2>{selectedCohort?.name ?? "Choose a cohort"}</h2></div>{selectedCohort ? <span>Grade {selectedCohort.grade}</span> : null}</header>
              {selectedCohort ? <>
                <div className="institution-admin-people">
                  <div><GraduationCap /><span><strong>{people?.learners.length ?? 0}</strong> learners</span></div>
                  <div><UsersRound /><span><strong>{people?.staff.length ?? 0}</strong> facilitators / staff</span></div>
                </div>
                <div className="institution-admin-person-list" data-workspace-section="overview facilitators">
                  {people?.staff.map((person) => <article key={person.user_id}><i>{(person.profile?.display_name || "F").slice(0, 1).toUpperCase()}</i><span><strong>{person.profile?.display_name || "Assigned facilitator"}</strong><small>{person.role === "educator" ? "Facilitator" : person.role === "lead" ? "Lead facilitator" : "Assistant facilitator"} · {person.status}</small></span></article>)}
                  {!people?.staff.length ? <p className="institution-admin-empty">No active facilitators are assigned to this course / cohort yet.</p> : null}
                </div>
                <div className="institution-admin-person-list" data-workspace-section="overview learners">
                  {people?.learners.map((learner) => <article key={learner.learner_id}><i>{(learner.profile?.display_name || "L").slice(0, 1).toUpperCase()}</i><span><strong>{learner.profile?.display_name || "Learner"}</strong><small>{learner.status}</small></span></article>)}
                  {!people?.learners.length ? <p className="institution-admin-empty">No learners enrolled yet.</p> : null}
                </div>
                {canManageLearners ? <form data-workspace-section="overview learners" className="institution-admin-form compact" onSubmit={(event) => {
                  event.preventDefault();
                  void run(async () => { await enrolLearner(selectedCohort.id, learnerEmail); setLearnerEmail(""); await refresh(schoolId, selectedCohort.id); }, "Learner assignment saved. If this email is not registered yet, access activates after the person signs up.");
                }}>
                  <p className="eyebrow">Add learner</p>
                  <div className="institution-admin-inline"><input type="email" required value={learnerEmail} onChange={(event) => setLearnerEmail(event.target.value)} placeholder="learner@example.com" /><button className="institutional-primary" disabled={busy}><UserPlus /> Enrol</button></div>
                </form> : null}
                {isAdmin ? <form data-workspace-section="overview facilitators" className="institution-admin-form compact" onSubmit={(event) => {
                  event.preventDefault();
                  void run(async () => { await addCohortStaff(selectedCohort.id, staffEmail, staffRole); setStaffEmail(""); await refresh(schoolId, selectedCohort.id); }, "Facilitator assignment saved. If this email is not registered yet, access activates after the person signs up.");
                }}>
                  <p className="eyebrow">Assign facilitator to this course / cohort</p>
                  <div className="institution-admin-inline"><input type="email" required value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} placeholder="facilitator@example.com" /><select aria-label="Facilitator assignment type" value={staffRole} onChange={(event) => setStaffRole(event.target.value as typeof staffRole)}><option value="lead">Lead facilitator</option><option value="educator">Facilitator (educator)</option><option value="assistant">Assistant facilitator</option></select><button className="institutional-primary" disabled={busy}><UserPlus /> Assign</button></div>
                </form> : null}
              </> : <p className="institution-admin-empty">Select a cohort to manage its learners and staff.</p>}
            </section>
          </div>

          {isAdmin ? <section data-workspace-section="overview team" className="institution-admin-card institution-admin-member-card">
            <header><div><p className="eyebrow">Institution team</p><h2>School-level access</h2><p>Assign access by email, even before registration. New accounts inherit the pending assignment after sign-up; platform administrator access is never granted through this form.</p></div></header>
            <form className="institution-admin-form" onSubmit={(event) => {
              event.preventDefault();
              void run(async () => { await addInstitutionMember(schoolId, memberEmail, memberRole); setMemberEmail(""); }, "Institution role assignment saved. If this email is not registered yet, access activates after the person signs up.");
            }}>
              <div className="institution-admin-inline"><input type="email" required value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="colleague@example.com" /><select value={memberRole} onChange={(event) => setMemberRole(event.target.value as typeof memberRole)}><option value="educator">Educator</option><option value="admin">Administrator</option></select><button className="institutional-primary" disabled={busy}><UserPlus /> Add member</button></div>
            </form>
          </section> : null}
        </>
      )}
    </main>
  );
}
