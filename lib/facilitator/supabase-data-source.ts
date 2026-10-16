"use client";
import { currentReviews } from "@/lib/evidence/current-reviews";
import { readAllRows, readRowsByIds } from "@/lib/supabase/read-all";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useFacilitatorAccess, type FacilitatorAccess } from "@/lib/facilitator/access-context";
import { curriculum } from "@/lib/curriculum";
import { buildEvidenceRecords } from "@/lib/evidence/engine";
import type { EvidenceRecord, EvidenceReview } from "@/lib/evidence/types";
import type { LearningState } from "@/lib/types";

const RELEASE = "ac-runtime-3";

export type SupabaseFacilitatorLearner = {
  id: string;
  state: LearningState;
  records: EvidenceRecord[];
  reviews: Record<string, EvidenceReview>;
};

export type SupabaseFacilitatorWorkspace = {
  mode: "supabase";
  cohortIds: string[];
  cohortName: string;
  schoolName: string;
  learners: SupabaseFacilitatorLearner[];
};

function emptyState(): LearningState {
  return { version: 2, previousResponses: {}, completed: {}, completedMeta: {}, responses: {}, responseUpdatedAt: {}, promptResponses: {}, promptResponseUpdatedAt: {} };
}

export async function loadSupabaseFacilitatorWorkspace(userId: string, verifiedAccess?: FacilitatorAccess): Promise<SupabaseFacilitatorWorkspace | null> {
  const supabase = createClient();
  const sharedAccess = verifiedAccess?.userId === userId ? verifiedAccess : null;
  let isPlatformAdmin = sharedAccess?.isPlatformAdmin ?? false;
  let cohortIds: string[] = sharedAccess ? [...sharedAccess.cohortIds] : [];
  if (!sharedAccess) {
    const { data, error } = await supabase.rpc("is_platform_admin");
    if (error) throw error;
    isPlatformAdmin = data === true;
    if (!isPlatformAdmin) {
      const { data: staff, error: staffError } = await readAllRows(supabase
        .from("cohort_staff")
        .select("cohort_id")
        .eq("user_id", userId)
        .eq("status", "active").order("id"));
      if (staffError) throw staffError;
      cohortIds = [...new Set((staff ?? []).map(row => row.cohort_id))];
      if (!cohortIds.length) return null;
    }
  }

  let activeCohorts: Array<{ id: string; name: string; school_id: string; grade: number; academic_year: number }> = [];

  if (isPlatformAdmin) {
    // Platform administrators can inspect all active cohorts; they do not need
    // an artificial personal cohort_staff assignment to enter this workspace.
    const { data, error } = await readAllRows(supabase
      .from("cohorts")
      .select("id,name,school_id,grade,academic_year")
      .eq("status", "active")
      .order("academic_year", { ascending: false })
      .order("name").order("id"));
    if (error) throw error;
    activeCohorts = data ?? [];
    cohortIds = activeCohorts.map(row => row.id);
  } else {
    if (!cohortIds.length) return null;
    const { data, error } = await readRowsByIds(cohortIds,ids=>supabase
      .from("cohorts")
      .select("id,name,school_id,grade,academic_year")
      .in("id", ids)
      .eq("status", "active").order("id"));
    if (error) throw error;
    activeCohorts = data ?? [];
    cohortIds = activeCohorts.map(row => row.id);
    if (!activeCohorts.length) return null;
  }

  const [enrolments, release] = await Promise.all([
    cohortIds.length
      ? readRowsByIds(cohortIds,ids=>supabase.from("cohort_enrolments").select("cohort_id,learner_id,status").in("cohort_id", ids).in("status", ["active", "completed"]).order("id"))
      : Promise.resolve({ data: [], error: null }),
    supabase.from("curriculum_releases").select("id").eq("release_key", RELEASE).single()
  ]);
  if (enrolments.error) throw enrolments.error;
  if (release.error) throw release.error;
  const schoolIds = [...new Set(activeCohorts.map(row => row.school_id))];
  const schoolsResult = schoolIds.length
    ? await readRowsByIds(schoolIds,ids=>supabase.from("schools").select("id,name").in("id", ids).order("id"))
    : { data: [], error: null };
  if (schoolsResult.error) throw schoolsResult.error;
  const schoolNames = (schoolsResult.data ?? []).map(row => row.name);
  const schoolName = schoolNames.join(" · ") || "Assigned school";
  const cohortName = activeCohorts
    .map(row => `${row.name} · Grade ${row.grade} · ${row.academic_year}`)
    .join(" · ") || "Assigned cohort";

  const learnerIds = [...new Set((enrolments.data ?? []).map(row => row.learner_id))];
  if (!learnerIds.length) return { mode: "supabase", cohortIds, cohortName, schoolName, learners: [] };

  const releaseId = release.data.id;
  const [profiles, learnerProfiles, progress, prompts, notes, evidence] = await Promise.all([
    readRowsByIds(learnerIds,ids=>supabase.from("profiles").select("id,display_name").in("id", ids).order("id")),
    readRowsByIds(learnerIds,ids=>supabase.from("learner_profiles").select("user_id,preferred_name,current_grade").in("user_id", ids).order("user_id")),
    readRowsByIds(learnerIds,ids=>supabase.from("lesson_progress").select("learner_id,grade,term,unit_id,status,last_opened_at,completed_at,updated_at").eq("curriculum_release_id", releaseId).in("learner_id", ids).order("id")),
    readRowsByIds(learnerIds,ids=>supabase.from("prompt_responses").select("learner_id,grade,term,unit_id,prompt_key,response,updated_at").eq("curriculum_release_id", releaseId).in("learner_id", ids).order("id")),
    readRowsByIds(learnerIds,ids=>supabase.from("lesson_notes").select("learner_id,unit_id,note,updated_at").eq("curriculum_release_id", releaseId).in("learner_id", ids).order("id")),
    readRowsByIds(learnerIds,ids=>supabase.from("evidence_records").select("id,learner_id,response_key").in("learner_id", ids).order("id"))
  ]);
  for (const result of [profiles, learnerProfiles, progress, prompts, notes, evidence]) if (result.error) throw result.error;

  const reviewResult = evidence.data?.length
    ? await readRowsByIds(evidence.data.map(row=>row.id),ids=>supabase.from("evidence_reviews").select("evidence_record_id,reviewer_id,rubric_key,status,criteria_scores,feedback,portfolio_interpretation,next_pathway,response_value_at_review,reviewed_at").in("evidence_record_id", ids).order("id"))
    : { data: [], error: null };
  if (reviewResult.error) throw reviewResult.error;

  const profileById = new Map((profiles.data ?? []).map(row => [row.id, row]));
  const learnerProfileById = new Map((learnerProfiles.data ?? []).map(row => [row.user_id, row]));
  const evidenceKeyById = new Map((evidence.data ?? []).map(row => [row.id, { learnerId: row.learner_id, responseKey: row.response_key }]));
  const reviewsByLearner = new Map<string, Record<string, EvidenceReview>>();

  for (const review of reviewResult.data ?? []) {
    const evidenceRef = evidenceKeyById.get(review.evidence_record_id);
    if (!evidenceRef) continue;
    const reviews = reviewsByLearner.get(evidenceRef.learnerId) ?? {};
    reviews[evidenceRef.responseKey] = {
      responseKey: evidenceRef.responseKey,
      rubricKey: review.rubric_key ?? undefined,
      status: review.status as EvidenceReview["status"],
      criteria: (review.criteria_scores ?? {}) as Record<string, 1 | 2 | 3 | 4>,
      feedback: review.feedback,
      portfolioInterpretation: review.portfolio_interpretation ?? "",
      nextPathway: review.next_pathway ?? "",
      reviewedAt: review.reviewed_at,
      responseValueAtReview:review.response_value_at_review??undefined
    };
    reviewsByLearner.set(evidenceRef.learnerId, reviews);
  }

  const stateByLearner = new Map<string, LearningState>();
  const promptsByLearner = new Map<string, Record<string, string>>();
  const unitsByLearner = new Map<string, Map<string, string>>();

  for (const learnerId of learnerIds) {
    const profile = profileById.get(learnerId);
    const learnerProfile = learnerProfileById.get(learnerId);
    const state = emptyState();
    state.profile = { displayName: learnerProfile?.preferred_name ?? profile?.display_name ?? undefined, grade: learnerProfile?.current_grade ?? undefined };
    state.activeGrade = state.profile.grade;
    stateByLearner.set(learnerId, state);
    promptsByLearner.set(learnerId, {});
    unitsByLearner.set(learnerId, new Map());
  }

  for (const row of progress.data ?? []) {
    const state = stateByLearner.get(row.learner_id);
    if (!state) continue;
    if (row.status === "completed") {
      state.completed[row.unit_id] = row.completed_at ?? row.updated_at;
      state.completedMeta![row.unit_id] = { grade: row.grade, term: row.term };
    }
    if (row.last_opened_at && (!state.lastOpened || row.last_opened_at > state.lastOpened.at)) {
      state.lastOpened = { grade: row.grade, term: row.term, unitId: row.unit_id, at: row.last_opened_at };
      state.activeGrade = row.grade;
    }
  }

  for (const row of notes.data ?? []) {
    const state = stateByLearner.get(row.learner_id);
    if (state) {
      state.responses[row.unit_id] = row.note;
      state.responseUpdatedAt![row.unit_id] = row.updated_at;
    }
  }

  for (const row of prompts.data ?? []) {
    const state = stateByLearner.get(row.learner_id);
    const promptMap = promptsByLearner.get(row.learner_id);
    if (!state || !promptMap) continue;
    const value = typeof row.response === "string" ? row.response : JSON.stringify(row.response);
    state.promptResponses[row.prompt_key] = value;
    state.promptResponseUpdatedAt![row.prompt_key] = row.updated_at;
    promptMap[row.prompt_key] = value;
    unitsByLearner.get(row.learner_id)?.set(row.unit_id, row.grade + ":" + row.term);
  }

  const learners: SupabaseFacilitatorLearner[] = [];
  for (const learnerId of learnerIds) {
    const state = stateByLearner.get(learnerId)!;
    const promptResponses = promptsByLearner.get(learnerId)!;
    const records: EvidenceRecord[] = [];
    for (const [unitId, gradeTerm] of unitsByLearner.get(learnerId)!) {
      const [storedGrade, storedTerm] = gradeTerm.split(":").map(Number);
      const unitContext = unitId.match(/^g(\d+)-t(\d+)-/);
      const inferredGrade = unitContext ? Number(unitContext[1]) : storedGrade;
      const inferredTerm = unitContext ? Number(unitContext[2]) : storedTerm;
      let unit;
      try {
        unit = await curriculum.unit(storedGrade, storedTerm, unitId);
      } catch (error) {
        if (inferredGrade === storedGrade && inferredTerm === storedTerm) throw error;
        unit = await curriculum.unit(inferredGrade, inferredTerm, unitId);
      }
      records.push(...buildEvidenceRecords(unit, promptResponses));
    }
    learners.push({ id: learnerId, state, records, reviews: currentReviews(reviewsByLearner.get(learnerId) ?? {},state.promptResponses) });
  }

  return {
    mode: "supabase",
    cohortIds,
    cohortName,
    schoolName,
    learners
  };
}

export async function saveSupabaseFacilitatorReview(learnerId: string, record: EvidenceRecord, review: EvidenceReview) {
  const supabase = createClient();
  const { error } = await supabase.rpc("save_facilitator_review", {
    p_learner_id: learnerId,
    p_response_key: record.responseKey,
    p_response_value: record.responseValue,
    p_auto_result: record.autoCheck,
    p_review: { status: review.status, rubricKey: review.rubricKey ?? null, criteria: review.criteria,
      feedback: review.feedback, portfolioInterpretation: review.portfolioInterpretation ?? "", nextPathway: review.nextPathway ?? "" }
  });
  if (error) throw error;
}

export function useSupabaseFacilitatorWorkspace() {
  const { user } = useAuth();
  const verifiedAccess = useFacilitatorAccess();
  const userId = user?.id;
  const [workspace, setWorkspace] = useState<SupabaseFacilitatorWorkspace | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload=useCallback(async()=>{
    if(!userId)return;
    const value=await loadSupabaseFacilitatorWorkspace(userId,verifiedAccess??undefined);
    setWorkspace(value);setLoadedUserId(userId);setError(null);
  },[userId,verifiedAccess]);

  useEffect(() => {
    let cancelled = false;
    if (!userId) return;
    void loadSupabaseFacilitatorWorkspace(userId, verifiedAccess ?? undefined).then(value => {
      if (!cancelled) {
        setWorkspace(value);
        setLoadedUserId(userId);
        setError(null);
      }
    }).catch(() => {
      if (!cancelled) {
        setWorkspace(null);
        setLoadedUserId(userId);
        setError("We couldn’t load your shared workspace. Please refresh and try again. If the problem continues, contact your institution administrator.");
      }
    });
    return () => { cancelled = true; };
  }, [userId, verifiedAccess]);

  const activeWorkspace = userId && loadedUserId === userId ? workspace : null;
  const activeLoading = Boolean(userId) && loadedUserId !== userId;
  const activeError = userId && loadedUserId === userId ? error : null;
  return { workspace: activeWorkspace, loading: activeLoading, error: activeError,reload };
}
