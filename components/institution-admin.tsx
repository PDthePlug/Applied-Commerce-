"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Building2, GraduationCap, Plus, RefreshCw, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/institution-admin/institution-admin.module.css";

type School = { id:string; name:string; slug:string; status:string };
type Membership = { id:string; user_id:string; school_id:string; role:string; status:string };
type Cohort = { id:string; school_id:string; name:string; grade:number; academic_year:number; status:string };
type CohortStaff = { id:string; cohort_id:string; user_id:string; role:string; status:string };
type Enrolment = { id:string; cohort_id:string; learner_id:string; status:string };
type Person = { id:string; display_name:string|null };

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export function InstitutionAdmin() {
  const { user } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [schools,setSchools] = useState<School[]>([]);
  const [members,setMembers] = useState<Membership[]>([]);
  const [people,setPeople] = useState<Record<string,Person>>({});
  const [cohorts,setCohorts] = useState<Cohort[]>([]);
  const [staff,setStaff] = useState<CohortStaff[]>([]);
  const [enrolments,setEnrolments] = useState<Enrolment[]>([]);
  const [selectedSchool,setSelectedSchool] = useState("");
  const [selectedCohort,setSelectedCohort] = useState("");
  const [schoolName,setSchoolName] = useState("");
  const [schoolSlug,setSchoolSlug] = useState("");
  const [memberEmail,setMemberEmail] = useState("");
  const [memberRole,setMemberRole] = useState("educator");
  const [cohortName,setCohortName] = useState("");
  const [grade,setGrade] = useState("8");
  const [academicYear,setAcademicYear] = useState(String(new Date().getFullYear()));
  const [staffEmail,setStaffEmail] = useState("");
  const [staffRole,setStaffRole] = useState("educator");
  const [learnerEmail,setLearnerEmail] = useState("");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");

  const loadSchools = useCallback(async () => {
    if (!user) return;
    const { data: memberships, error: membershipError } = await supabase
      .from("school_memberships")
      .select("id,user_id,school_id,role,status")
      .eq("user_id",user.id)
      .in("role",["owner","admin"])
      .eq("status","active");
    if (membershipError) throw membershipError;

    const schoolIds = [...new Set((memberships ?? []).map(item => item.school_id))];
    if (!schoolIds.length) {
      setSchools([]);
      setSelectedSchool("");
      return;
    }

    const { data: schoolRows, error: schoolError } = await supabase
      .from("schools").select("id,name,slug,status").in("id",schoolIds);
    if (schoolError) throw schoolError;

    setSchools((schoolRows ?? []) as School[]);
    setSelectedSchool(current =>
      current && (schoolRows ?? []).some(s=>s.id===current)
        ? current
        : ((schoolRows ?? [])[0]?.id ?? "")
    );
  }, [supabase, user]);

  const loadSchool = useCallback(async (schoolId:string) => {
    if (!schoolId) return;
    const { data: memberRows, error: memberError } = await supabase
      .from("school_memberships").select("id,user_id,school_id,role,status").eq("school_id",schoolId);
    if (memberError) throw memberError;
    const { data: cohortRows, error: cohortError } = await supabase
      .from("cohorts").select("id,school_id,name,grade,academic_year,status")
      .eq("school_id",schoolId).order("academic_year",{ascending:false}).order("grade");
    if (cohortError) throw cohortError;

    setMembers((memberRows ?? []) as Membership[]);
    setCohorts((cohortRows ?? []) as Cohort[]);
    setSelectedCohort(current =>
      current && (cohortRows ?? []).some(c=>c.id===current)
        ? current
        : ((cohortRows ?? [])[0]?.id ?? "")
    );

    const ids = [...new Set((memberRows ?? []).map(m=>m.user_id))];
    if (ids.length) {
      const { data: profileRows, error: profileError } = await supabase
        .from("profiles").select("id,display_name").in("id",ids);
      if (profileError) throw profileError;
      setPeople(current => ({
        ...current,
        ...Object.fromEntries((profileRows ?? []).map(p=>[p.id,p as Person]))
      }));
    }
  }, [supabase]);

  const loadCohort = useCallback(async (cohortId:string) => {
    if (!cohortId) { setStaff([]); setEnrolments([]); return; }
    const [{data:staffRows,error:staffError},{data:enrolmentRows,error:enrolmentError}] = await Promise.all([
      supabase.from("cohort_staff").select("id,cohort_id,user_id,role,status").eq("cohort_id",cohortId),
      supabase.from("cohort_enrolments").select("id,cohort_id,learner_id,status").eq("cohort_id",cohortId)
    ]);
    if (staffError) throw staffError;
    if (enrolmentError) throw enrolmentError;
    setStaff((staffRows ?? []) as CohortStaff[]);
    setEnrolments((enrolmentRows ?? []) as Enrolment[]);

    const ids = [...new Set([
      ...(staffRows ?? []).map(s=>s.user_id),
      ...(enrolmentRows ?? []).map(e=>e.learner_id)
    ])];
    if (ids.length) {
      const {data: profileRows,error:profileError}=await supabase
        .from("profiles").select("id,display_name").in("id",ids);
      if(profileError) throw profileError;
      setPeople(current=>({
        ...current,
        ...Object.fromEntries((profileRows ?? []).map(p=>[p.id,p as Person]))
      }));
    }
  }, [supabase]);

  useEffect(()=>{
    void loadSchools().catch(e=>setError(errorText(e)));
  },[loadSchools]);
  useEffect(()=>{
    void loadSchool(selectedSchool).catch(e=>setError(errorText(e)));
  },[loadSchool,selectedSchool]);
  useEffect(()=>{
    void loadCohort(selectedCohort).catch(e=>setError(errorText(e)));
  },[loadCohort,selectedCohort]);

  async function run(action:()=>Promise<void>, success:string) {
    setBusy(true); setError(""); setMessage("");
    try { await action(); setMessage(success); }
    catch(e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }

  async function createSchool() {
    await run(async()=>{
      const {data,error}=await supabase.rpc("create_school",{p_name:schoolName.trim(),p_slug:schoolSlug.trim().toLowerCase()});
      if(error) throw error;
      if(!data) throw new Error("School was not created.");
      setSchoolName(""); setSchoolSlug("");
      await loadSchools();
    },"School created. The current account is now its owner.");
  }

  async function addMember() {
    await run(async()=>{
      if(!selectedSchool) throw new Error("Select a school first.");
      const {error}=await supabase.rpc("add_school_member_by_email",{
        p_school_id:selectedSchool,p_email:memberEmail.trim(),p_role:memberRole
      });
      if(error) throw error;
      setMemberEmail(""); await loadSchool(selectedSchool);
    },"School membership saved.");
  }

  async function createCohort() {
    await run(async()=>{
      if(!selectedSchool) throw new Error("Create or select a school first.");
      const {error}=await supabase.from("cohorts").insert({
        school_id:selectedSchool,name:cohortName.trim(),grade:Number(grade),
        academic_year:Number(academicYear),status:"active"
      });
      if(error) throw error;
      setCohortName(""); await loadSchool(selectedSchool);
    },"Cohort created.");
  }

  async function addStaff() {
    await run(async()=>{
      if(!selectedCohort) throw new Error("Select a cohort first.");
      const {error}=await supabase.rpc("add_cohort_staff_by_email",{
        p_cohort_id:selectedCohort,p_email:staffEmail.trim(),p_role:staffRole
      });
      if(error) throw error;
      setStaffEmail(""); await loadCohort(selectedCohort);
    },"Cohort staff assignment saved.");
  }

  async function enrolLearner() {
    await run(async()=>{
      if(!selectedCohort) throw new Error("Select a cohort first.");
      const {error}=await supabase.rpc("enrol_learner_by_email",{
        p_cohort_id:selectedCohort,p_email:learnerEmail.trim()
      });
      if(error) throw error;
      setLearnerEmail(""); await loadCohort(selectedCohort);
    },"Learner enrolled.");
  }

  if(!user) return <main className={styles.page}><div className={styles.empty}><ShieldCheck/><h1>Institution administration</h1><p>Sign in with an Applied Commerce account to manage an institution.</p></div></main>;

  return <main className={styles.page}>
    <header className={styles.hero}>
      <div>
        <p className={styles.eyebrow}>Applied Commerce · Operations</p>
        <h1>Institution administration</h1>
        <p>Provision the real school, cohort, facilitator and learner relationships that the facilitator workspace already consumes.</p>
      </div>
      <div className={styles.heroBadge}><ShieldCheck/><span>Role-scoped</span><strong>Owner / Admin</strong></div>
    </header>

    {(message||error) && <div className={error?styles.alert:styles.success}>{error||message}</div>}

    {schools.length===0 ? <section className={styles.panel}>
      <div className={styles.panelHead}><div><p className={styles.eyebrow}>Start here</p><h2>Create an institution</h2><p>The first account becomes the school owner. This is the bootstrap step for a real deployment.</p></div><Building2/></div>
      <form className={styles.form} onSubmit={e=>{e.preventDefault();void createSchool();}}>
        <label>School or institution name<input value={schoolName} onChange={e=>setSchoolName(e.target.value)} placeholder="e.g. Applied Commerce Academy" required/></label>
        <label>Slug<input value={schoolSlug} onChange={e=>setSchoolSlug(e.target.value)} placeholder="applied-commerce-academy" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required/></label>
        <button disabled={busy}><Plus/> Create institution</button>
      </form>
    </section> : <>
      <section className={styles.selectorBar}>
        <label>Institution<select value={selectedSchool} onChange={e=>setSelectedSchool(e.target.value)}>{schools.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <button className={styles.secondary} onClick={()=>void run(async()=>{
          await loadSchools(); if(selectedSchool)await loadSchool(selectedSchool); if(selectedCohort)await loadCohort(selectedCohort);
        },"Workspace refreshed.")} disabled={busy}><RefreshCw/> Refresh</button>
      </section>

      <div className={styles.grid}>
        <section className={styles.panel}>
          <div className={styles.panelHead}><div><p className={styles.eyebrow}>People</p><h2>School team</h2><p>Add existing Applied Commerce accounts to the institution.</p></div><Users/></div>
          <form className={styles.form} onSubmit={e=>{e.preventDefault();void addMember();}}>
            <label>Account email<input type="email" value={memberEmail} onChange={e=>setMemberEmail(e.target.value)} placeholder="facilitator@example.com" required/></label>
            <label>Role<select value={memberRole} onChange={e=>setMemberRole(e.target.value)}><option value="educator">Educator</option><option value="admin">Admin</option><option value="owner">Owner</option></select></label>
            <button disabled={busy}><Plus/> Add to school</button>
          </form>
          <div className={styles.list}>{members.map(m=><div key={m.id}><strong>{people[m.user_id]?.display_name||"Account"}</strong><span>{m.role} · {m.status}</span></div>)}</div>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHead}><div><p className={styles.eyebrow}>Cohorts</p><h2>Create a delivery group</h2><p>These are the cohorts the facilitator workspace will read.</p></div><GraduationCap/></div>
          <form className={styles.form} onSubmit={e=>{e.preventDefault();void createCohort();}}>
            <label>Cohort name<input value={cohortName} onChange={e=>setCohortName(e.target.value)} placeholder="Grade 10 · 2027 · Class A" required/></label>
            <div className={styles.two}><label>Grade<select value={grade} onChange={e=>setGrade(e.target.value)}>{[8,9,10,11,12].map(g=><option key={g}>{g}</option>)}</select></label><label>Academic year<input type="number" value={academicYear} onChange={e=>setAcademicYear(e.target.value)} min="2020" max="2100" required/></label></div>
            <button disabled={busy}><Plus/> Create cohort</button>
          </form>
          <div className={styles.list}>{cohorts.map(c=><button key={c.id} className={selectedCohort===c.id?styles.listActive:styles.listButton} onClick={()=>setSelectedCohort(c.id)}><strong>{c.name}</strong><span>Grade {c.grade} · {c.academic_year} · {c.status}</span></button>)}</div>
        </section>
      </div>

      {selectedCohort && <section className={styles.panel}>
        <div className={styles.panelHead}><div><p className={styles.eyebrow}>Selected cohort</p><h2>{cohorts.find(c=>c.id===selectedCohort)?.name}</h2><p>Assign staff and enrol learners using existing Applied Commerce accounts.</p></div><Users/></div>
        <div className={styles.grid}>
          <div>
            <form className={styles.form} onSubmit={e=>{e.preventDefault();void addStaff();}}>
              <label>Facilitator account email<input type="email" value={staffEmail} onChange={e=>setStaffEmail(e.target.value)} placeholder="educator@example.com" required/></label>
              <label>Role<select value={staffRole} onChange={e=>setStaffRole(e.target.value)}><option value="educator">Educator</option><option value="lead">Lead</option><option value="assistant">Assistant</option></select></label>
              <button disabled={busy}><Plus/> Assign staff</button>
            </form>
            <div className={styles.list}>{staff.map(s=><div key={s.id}><strong>{people[s.user_id]?.display_name||"Account"}</strong><span>{s.role} · {s.status}</span></div>)}</div>
          </div>
          <div>
            <form className={styles.form} onSubmit={e=>{e.preventDefault();void enrolLearner();}}>
              <label>Learner account email<input type="email" value={learnerEmail} onChange={e=>setLearnerEmail(e.target.value)} placeholder="learner@example.com" required/></label>
              <button disabled={busy}><Plus/> Enrol learner</button>
            </form>
            <div className={styles.list}>{enrolments.map(e=><div key={e.id}><strong>{people[e.learner_id]?.display_name||"Learner account"}</strong><span>{e.status}</span></div>)}</div>
          </div>
        </div>
      </section>}
    </>}
  </main>;
}
