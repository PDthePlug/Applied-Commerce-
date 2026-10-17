"use client";

import { readAllRows, readRowsByIds } from "@/lib/supabase/read-all";
import { curriculum } from "@/lib/curriculum";
import { buildEvidenceRecords } from "@/lib/evidence/engine";
import { currentReviews, hasReviewDecision } from "@/lib/evidence/current-reviews";
import type { EvidenceReview } from "@/lib/evidence/types";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

export type School = Tables<"schools">;
export type Cohort = Tables<"cohorts">;

export async function loadInstitutionalContext(userId: string) {
  const supabase = createClient();
  const [{ data: isPlatformAdmin, error: platformAdminError }, { data: memberships, error: membershipError }] =
    await Promise.all([
      supabase.rpc("is_platform_admin"),
      readAllRows(supabase
        .from("school_memberships")
        .select("school_id,role,status")
        .eq("user_id", userId)
        .eq("status", "active").order("id"))
    ]);

  if (platformAdminError) throw platformAdminError;
  if (membershipError) throw membershipError;

  const schoolIds = isPlatformAdmin
    ? undefined
    : [...new Set((memberships ?? []).map((row) => row.school_id))];
  if (schoolIds && !schoolIds.length) {
    return { isPlatformAdmin: Boolean(isPlatformAdmin), schools: [] as School[], memberships: memberships ?? [], cohorts: [] as Cohort[], selectedSchoolId: "" };
  }

  const schoolQuery = () => supabase
    .from("schools")
    .select("id,name,slug,status,metadata,created_at,updated_at")
    .eq("status", "active")
    .order("name").order("id");
  const { data: schools, error: schoolError } = schoolIds
    ? await readRowsByIds(schoolIds,ids=>schoolQuery().in("id",ids))
    : await readAllRows(schoolQuery());
  if (schoolError) throw schoolError;
  schools.sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));

  const visibleSchoolIds = (schools ?? []).map((school) => school.id);
  if (!visibleSchoolIds.length) {
    return { isPlatformAdmin: Boolean(isPlatformAdmin), schools: [], memberships: memberships ?? [], cohorts: [] as Cohort[], selectedSchoolId: "" };
  }

  const { data: cohorts, error: cohortError } = await readRowsByIds(visibleSchoolIds,ids=>supabase
    .from("cohorts")
    .select("id,school_id,name,grade,academic_year,status,starts_on,ends_on,created_at,updated_at")
    .in("school_id", ids)
    .order("academic_year", { ascending: false })
    .order("name").order("id"));

  if (cohortError) throw cohortError;
  cohorts.sort((a,b)=>b.academic_year-a.academic_year||a.name.localeCompare(b.name)||a.id.localeCompare(b.id));

  return {
    isPlatformAdmin: Boolean(isPlatformAdmin),
    schools: schools ?? [],
    memberships: memberships ?? [],
    cohorts: cohorts ?? [],
    selectedSchoolId: schools?.[0]?.id ?? ""
  };
}

export async function createInstitution(schoolName: string, slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("create_school", {
    p_name: schoolName.trim(),
    p_slug: slug.trim().toLowerCase()
  });
  if (error) throw error;
  return data;
}

export async function createInstitutionCohort(input: {
  schoolId: string;
  name: string;
  grade: number;
  academicYear: number;
  startsOn?: string;
  endsOn?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cohorts")
    .insert({
      school_id: input.schoolId,
      name: input.name.trim(),
      grade: input.grade,
      academic_year: input.academicYear,
      status: "active",
      starts_on: input.startsOn || null,
      ends_on: input.endsOn || null
    })
    .select("id,school_id,name,grade,academic_year,status,starts_on,ends_on,created_at,updated_at")
    .single();

  if (error) throw error;
  return data;
}

export async function addInstitutionMember(schoolId: string, email: string, role: "admin" | "educator") {
  const supabase = createClient();
  const { error } = await supabase.rpc("add_school_member_by_email", {
    p_school_id: schoolId,
    p_email: email.trim(),
    p_role: role
  });
  if (error) throw error;
}

export async function addCohortStaff(cohortId: string, email: string, role: "lead" | "educator" | "assistant") {
  const supabase = createClient();
  const { error } = await supabase.rpc("add_cohort_staff_by_email", {
    p_cohort_id: cohortId,
    p_email: email.trim(),
    p_role: role
  });
  if (error) throw error;
}

export async function enrolLearner(cohortId: string, email: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("enrol_learner_by_email", {
    p_cohort_id: cohortId,
    p_email: email.trim()
  });
  if (error) throw error;
}

export async function loadCohortPeople(cohortId: string) {
  const supabase = createClient();
  const [enrolments, staff] = await Promise.all([
    readAllRows(supabase
      .from("cohort_enrolments")
      .select("learner_id,status,enrolled_at,completed_at")
      .eq("cohort_id", cohortId)
      .in("status", ["active", "completed"])
      .order("enrolled_at").order("id")),
    readAllRows(supabase
      .from("cohort_staff")
      .select("user_id,role,status,created_at")
      .eq("cohort_id", cohortId)
      .eq("status", "active")
      .order("created_at").order("id"))
  ]);

  if (enrolments.error) throw enrolments.error;
  if (staff.error) throw staff.error;

  const learnerIds = [...new Set((enrolments.data ?? []).map((row) => row.learner_id))];
  const staffIds = [...new Set((staff.data ?? []).map((row) => row.user_id))];

  // Keep UUID filters below URL limits as well as paginating the result set.
  async function loadProfiles(ids: string[]) {
    const result = await readRowsByIds(ids,batch=>supabase.from("profiles").select("id,display_name,status").in("id",batch).order("id"));
    return new Map(result.data.map(profile => [profile.id, profile]));
  }
  const [learnerProfiles, staffProfiles] = await Promise.all([loadProfiles(learnerIds), loadProfiles(staffIds)]);

  return {
    learners: (enrolments.data ?? []).map((row) => ({
      ...row,
      profile: learnerProfiles.get(row.learner_id) ?? null
    })),
    staff: (staff.data ?? []).map((row) => ({
      ...row,
      profile: staffProfiles.get(row.user_id) ?? null
    })),
    staffIds
  };
}

export type CohortLearningInsights = {
  learnerCount: number;
  suppressed: boolean;
  completedLessons: number;
  savedResponses: number;
  evidenceRecords: number;
  reviewedEvidence: number;
  needsRevision: number;
  reviewCoverage: number;
};

export async function loadCohortLearningInsights(cohortId: string): Promise<CohortLearningInsights> {
  const supabase = createClient();
  const { data: enrolments, error: enrolmentError } = await readAllRows(supabase
    .from("cohort_enrolments")
    .select("learner_id")
    .eq("cohort_id", cohortId)
    .eq("status", "active").order("id"));
  if (enrolmentError) throw enrolmentError;

  const learnerIds = [...new Set((enrolments ?? []).map(row => row.learner_id))];
  const base: CohortLearningInsights = {
    learnerCount: learnerIds.length,
    suppressed: learnerIds.length < 5,
    completedLessons: 0,
    savedResponses: 0,
    evidenceRecords: 0,
    reviewedEvidence: 0,
    needsRevision: 0,
    reviewCoverage: 0
  };
  // Small cohorts do not receive derived learning metrics that could reveal
  // an individual learner's performance.
  if (base.suppressed || !learnerIds.length) return base;

  const release=await supabase.from("curriculum_releases").select("id").eq("release_key","ac-runtime-3").single();
  if(release.error)throw release.error;
  const [completed, responses, evidence, catalogue] = await Promise.all([
    readRowsByIds(learnerIds,ids=>supabase.from("lesson_progress").select("learner_id,unit_id").in("learner_id",ids).eq("curriculum_release_id",release.data.id).eq("status","completed").order("id")),
    readRowsByIds(learnerIds,ids=>supabase.from("prompt_responses").select("learner_id,prompt_key,response,grade,term,unit_id").in("learner_id", ids).eq("curriculum_release_id",release.data.id).order("id")),
    readRowsByIds(learnerIds,ids=>supabase.from("evidence_records").select("id,learner_id,response_key").in("learner_id", ids).order("id")),
    curriculum.index()
  ]);
  for (const result of [completed, responses, evidence]) if (result.error) throw result.error;
  const evidenceIds = evidence.data.map(row => row.id);
  const reviews = evidenceIds.length
    ? await readRowsByIds(evidenceIds,ids=>supabase.from("evidence_reviews").select("evidence_record_id,status,response_value_at_review,reviewed_at").in("evidence_record_id", ids).order("id"))
    : { data: [], error: null };
  if (reviews.error) throw reviews.error;

  const evidenceById=new Map(evidence.data.map(row=>[row.id,row]));
  const reviewsByLearner=new Map<string,Record<string,EvidenceReview>>();
  for(const row of reviews.data){
    const record=evidenceById.get(row.evidence_record_id);
    if(!record)continue;
    const map=reviewsByLearner.get(record.learner_id)??{};
    map[record.response_key]={responseKey:record.response_key,status:row.status as EvidenceReview["status"],responseValueAtReview:row.response_value_at_review??undefined,reviewedAt:row.reviewed_at,criteria:{},feedback:""};
    reviewsByLearner.set(record.learner_id,map);
  }
  let evidenceCount=0,reviewCount=0,needsRevision=0;
  for(const learnerId of learnerIds){
    const rows=responses.data.filter(row=>row.learner_id===learnerId);
    const answers=Object.fromEntries(rows.map(row=>[row.prompt_key,typeof row.response==="string"?row.response:JSON.stringify(row.response)]));
    const current=currentReviews(reviewsByLearner.get(learnerId)??{},answers);
    const refs=new Map(rows.map(row=>[row.unit_id,{grade:row.grade,term:row.term}]));
    for(const [unitId,context] of refs){
      const unit=await curriculum.unit(context.grade,context.term,unitId);
      const records=buildEvidenceRecords(unit,answers);
      evidenceCount+=records.length;
      for(const record of records){const decision=current[record.responseKey];if(hasReviewDecision(decision)){reviewCount++;if(decision.status==="needs-revision")needsRevision++;}}
    }
  }
  const lessonIds=new Set(catalogue.grades.flatMap(grade=>grade.lessonIds??[]));
  const completedLessons=new Set(completed.data.filter(row=>lessonIds.has(row.unit_id)).map(row=>`${row.learner_id}:${row.unit_id}`)).size;
  return {...base,completedLessons,savedResponses:responses.data.length,
    evidenceRecords:evidenceCount,reviewedEvidence:reviewCount,needsRevision,
    reviewCoverage:evidenceCount?Math.round(reviewCount/evidenceCount*100):0};
}
