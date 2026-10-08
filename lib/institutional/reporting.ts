"use client";

import { createClient } from "@/lib/supabase/client";
import { curriculum } from "@/lib/curriculum";

export type InstitutionalReportCohort = {
  id: string;
  name: string;
  grade: number;
  academicYear: number;
  learnerCount: number;
  completedLessons: number;
  totalLessons: number;
  completionRate: number;
  evidenceCount: number;
  reviewedCount: number;
  needsRevision: number;
  verified: number;
  lastActivity: string | null;
};

export type InstitutionalReportLearner = {
  id: string;
  name: string;
  cohortName: string;
  grade: number;
  completionRate: number;
  completedLessons: number;
  evidenceCount: number;
  needsRevision: number;
  lastActivity: string | null;
};

export type InstitutionalReport = {
  school: { id: string; name: string; slug: string };
  cohorts: InstitutionalReportCohort[];
  learners: InstitutionalReportLearner[];
  totals: {
    learners: number;
    cohorts: number;
    evidence: number;
    reviewed: number;
    needsRevision: number;
    verified: number;
    completionRate: number;
  };
};

export async function loadInstitutionalReport(userId: string, schoolId: string): Promise<InstitutionalReport> {
  const supabase = createClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("school_memberships")
    .select("school_id,role,status")
    .eq("school_id", schoolId)
    .eq("user_id", userId)
    .in("role", ["owner", "admin"])
    .eq("status", "active")
    .limit(1);
  if (membershipError) throw membershipError;
  if (!memberships?.length) throw new Error("This account is not an institution administrator.");

  const [schoolResult, cohortResult, releaseResult] = await Promise.all([
    supabase.from("schools").select("id,name,slug").eq("id", schoolId).single(),
    supabase.from("cohorts").select("id,name,grade,academic_year,status").eq("school_id", schoolId).order("academic_year", { ascending: false }).order("grade"),
    supabase.from("curriculum_releases").select("id").eq("release_key", "ac-runtime-3").single()
  ]);
  if (schoolResult.error) throw schoolResult.error;
  if (cohortResult.error) throw cohortResult.error;
  if (releaseResult.error) throw releaseResult.error;

  const cohorts = cohortResult.data ?? [];
  if (!cohorts.length) return { school: schoolResult.data, cohorts: [], learners: [], totals: { learners: 0, cohorts: 0, evidence: 0, reviewed: 0, needsRevision: 0, verified: 0, completionRate: 0 } };

  const cohortIds = cohorts.map(c => c.id);
  const { data: enrolments, error: enrolmentError } = await supabase
    .from("cohort_enrolments")
    .select("id,cohort_id,learner_id,status")
    .in("cohort_id", cohortIds)
    .in("status", ["active", "completed"]);
  if (enrolmentError) throw enrolmentError;

  const learnerIds = [...new Set((enrolments ?? []).map(row => row.learner_id))];
  if (!learnerIds.length) return { school: schoolResult.data, cohorts: cohorts.map(c => ({ id: c.id, name: c.name, grade: c.grade, academicYear: c.academic_year, learnerCount: 0, completedLessons: 0, totalLessons: 0, completionRate: 0, evidenceCount: 0, reviewedCount: 0, needsRevision: 0, verified: 0, lastActivity: null })), learners: [], totals: { learners: 0, cohorts: cohorts.length, evidence: 0, reviewed: 0, needsRevision: 0, verified: 0, completionRate: 0 } };

  const [profiles, progress, evidence, release] = await Promise.all([
    supabase.from("profiles").select("id,display_name").in("id", learnerIds),
    supabase.from("lesson_progress").select("learner_id,grade,status,last_opened_at,completed_at,updated_at").eq("curriculum_release_id", releaseResult.data.id).in("learner_id", learnerIds),
    supabase.from("evidence_records").select("id,learner_id").in("learner_id", learnerIds),
    Promise.resolve(releaseResult.data)
  ]);
  if (profiles.error) throw profiles.error;
  if (progress.error) throw progress.error;
  if (evidence.error) throw evidence.error;

  const evidenceIds = (evidence.data ?? []).map(row => row.id);
  const reviewResult = evidenceIds.length
    ? await supabase.from("evidence_reviews").select("evidence_record_id,status").in("evidence_record_id", evidenceIds)
    : { data: [], error: null };
  if (reviewResult.error) throw reviewResult.error;

  const profileMap = new Map((profiles.data ?? []).map(p => [p.id, p.display_name?.trim() || "Learner"]));
  const cohortMap = new Map(cohorts.map(c => [c.id, c]));
  const enrolmentMap = new Map<string, string>();
  for (const row of enrolments ?? []) if (!enrolmentMap.has(row.learner_id)) enrolmentMap.set(row.learner_id, row.cohort_id);

  const progressByLearner = new Map<string, typeof progress.data>();
  for (const row of progress.data ?? []) progressByLearner.set(row.learner_id, [...(progressByLearner.get(row.learner_id) ?? []), row]);
  const evidenceByLearner = new Map<string, string[]>();
  for (const row of evidence.data ?? []) evidenceByLearner.set(row.learner_id, [...(evidenceByLearner.get(row.learner_id) ?? []), row.id]);
  const reviewByEvidence = new Map((reviewResult.data ?? []).map(row => [row.evidence_record_id, row.status]));

  const lessonCounts = new Map<number, number>();
  for (const cohort of cohorts) {
    if (!lessonCounts.has(cohort.grade)) lessonCounts.set(cohort.grade, (await curriculum.grade(cohort.grade)).unitCount);
  }

  const learners: InstitutionalReportLearner[] = learnerIds.map(id => {
    const cohort = cohortMap.get(enrolmentMap.get(id) ?? "");
    const rows = progressByLearner.get(id) ?? [];
    const completedLessons = rows.filter(row => row.status === "completed").length;
    const totalLessons = lessonCounts.get(cohort?.grade ?? rows[0]?.grade ?? 0) ?? 0;
    const evidenceIdsForLearner = evidenceByLearner.get(id) ?? [];
    const needsRevision = evidenceIdsForLearner.filter(evidenceId => reviewByEvidence.get(evidenceId) === "needs-revision").length;
    const lastActivity = rows.map(row => row.last_opened_at ?? row.updated_at).filter(Boolean).sort().at(-1) ?? null;
    return {
      id, name: profileMap.get(id) ?? "Learner",
      cohortName: cohort?.name ?? "Cohort", grade: cohort?.grade ?? rows[0]?.grade ?? 0,
      completionRate: totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0,
      completedLessons, evidenceCount: evidenceIdsForLearner.length, needsRevision, lastActivity
    };
  });

  const reportCohorts = cohorts.map(cohort => {
    const cohortLearners = learners.filter(learner => learner.cohortName === cohort.name);
    const ids = new Set(cohortLearners.map(learner => learner.id));
    const evidenceCount = [...evidenceByLearner.entries()].filter(([id]) => ids.has(id)).reduce((sum, [, values]) => sum + values.length, 0);
    const reviewStatuses = [...evidenceByLearner.entries()].filter(([id]) => ids.has(id)).flatMap(([, values]) => values.map(id => reviewByEvidence.get(id)).filter(Boolean));
    const completedLessons = cohortLearners.reduce((sum, learner) => sum + learner.completedLessons, 0);
    const totalLessons = cohortLearners.length * (lessonCounts.get(cohort.grade) ?? 0);
    const lastActivity = cohortLearners.map(learner => learner.lastActivity).filter(Boolean).sort().at(-1) ?? null;
    return {
      id: cohort.id, name: cohort.name, grade: cohort.grade, academicYear: cohort.academic_year,
      learnerCount: cohortLearners.length, completedLessons, totalLessons,
      completionRate: totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0,
      evidenceCount, reviewedCount: reviewStatuses.length,
      needsRevision: reviewStatuses.filter(status => status === "needs-revision").length,
      verified: reviewStatuses.filter(status => status === "verified").length,
      lastActivity
    };
  });

  const totalLessons = reportCohorts.reduce((sum, cohort) => sum + cohort.totalLessons, 0);
  const completedLessons = reportCohorts.reduce((sum, cohort) => sum + cohort.completedLessons, 0);
  return {
    school: schoolResult.data,
    cohorts: reportCohorts,
    learners,
    totals: {
      learners: learners.length, cohorts: cohorts.length,
      evidence: reportCohorts.reduce((sum, cohort) => sum + cohort.evidenceCount, 0),
      reviewed: reportCohorts.reduce((sum, cohort) => sum + cohort.reviewedCount, 0),
      needsRevision: reportCohorts.reduce((sum, cohort) => sum + cohort.needsRevision, 0),
      verified: reportCohorts.reduce((sum, cohort) => sum + cohort.verified, 0),
      completionRate: totalLessons ? Math.round(completedLessons / totalLessons * 100) : 0
    }
  };
}
