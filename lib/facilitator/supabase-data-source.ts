"use client";

import { useEffect, useState } from "react";
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
      const { data: staff, error: staffError } = await supabase
        .from("cohort_staff")
        .select("cohort_id")
        .eq("user_id", userId)
        .eq("status", "active");
      if (staffError) throw staffError;
      cohortIds = [...new Set((staff ?? []).map(row => row.cohort_id))];
      if (!cohortIds.length) return null;
    }
  }

  let activeCohorts: Array<{ id: string; name: string; school_id: string; grade: number; academic_year: number }> = [];

  if (isPlatformAdmin) {
    // Platform administrators can inspect all active cohorts; they do not need
    // an artificial personal cohort_staff assignment to enter this workspace.
    const { data, error } = await supabase
      .from("cohorts")
      .select("id,name,school_id,grade,academic_year")
      .eq("status", "active")
      .order("academic_year", { ascending: false })
      .order("name");
    if (error) throw error;
    activeCohorts = data ?? [];
    cohortIds = activeCohorts.map(row => row.id);
  } else {
    if (!cohortIds.length) return null;
    const { data, error } = await supabase
      .from("cohorts")
      .select("id,name,school_id,grade,academic_year")
      .in("id", cohortIds)
      .eq("status", "active");
    if (error) throw error;
    activeCohorts = data ?? [];
    cohortIds = activeCohorts.map(row => row.id);
    if (!activeCohorts.length) return null;
  }

  const [enrolments, release] = await Promise.all([
    cohortIds.length
      ? supabase.from("cohort_enrolments").select("cohort_id,learner_id,status").in("cohort_id", cohortIds).in("status", ["active", "completed"])
      : Promise.resolve({ data: [], error: null }),
    supabase.from("curriculum_releases").select("id").eq("release_key", RELEASE).single()
  ]);
  if (enrolments.error) throw enrolments.error;
  if (release.error) throw release.error;
  const schoolIds = [...new Set(activeCohorts.map(row => row.school_id))];
  const schoolsResult = schoolIds.length
    ? await supabase.from("schools").select("id,name").in("id", schoolIds)
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
    supabase.from("profiles").select("id,display_name").in("id", learnerIds),
    supabase.from("learner_profiles").select("user_id,preferred_name,current_grade").in("user_id", learnerIds),
    supabase.from("lesson_progress").select("learner_id,grade,term,unit_id,status,last_opened_at,completed_at,updated_at").eq("curriculum_release_id", releaseId).in("learner_id", learnerIds),
    supabase.from("prompt_responses").select("learner_id,grade,term,unit_id,prompt_key,response,updated_at").eq("curriculum_release_id", releaseId).in("learner_id", learnerIds),
    supabase.from("lesson_notes").select("learner_id,unit_id,note,updated_at").eq("curriculum_release_id", releaseId).in("learner_id", learnerIds),
    supabase.from("evidence_records").select("id,learner_id,response_key").in("learner_id", learnerIds)
  ]);
  for (const result of [profiles, learnerProfiles, progress, prompts, notes, evidence]) if (result.error) throw result.error;

  const reviewResult = evidence.data?.length
    ? await supabase.from("evidence_reviews").select("evidence_record_id,reviewer_id,rubric_key,status,criteria_scores,feedback,reviewed_at").in("evidence_record_id", evidence.data.map(row => row.id))
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
      reviewedAt: review.reviewed_at
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
    learners.push({ id: learnerId, state, records, reviews: reviewsByLearner.get(learnerId) ?? {} });
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
  const { data: recordId, error: recordError } = await supabase.rpc("upsert_facilitator_evidence_record", {
    p_learner_id: learnerId,
    p_response_key: record.responseKey,
    p_response_value: record.responseValue,
    p_auto_result: record.autoCheck,
    p_status: review.status
  });
  if (recordError) throw recordError;
  if (!recordId) throw new Error("Unable to persist the evidence record.");

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Authentication required");

  const payload = {
    evidence_record_id: recordId,
    reviewer_id: userData.user.id,
    rubric_key: review.rubricKey ?? null,
    status: review.status,
    criteria_scores: review.criteria,
    feedback: review.feedback,
    reviewed_at: review.reviewedAt,
    updated_at: new Date().toISOString()
  };

  const existing = await supabase.from("evidence_reviews").select("id,reviewer_id").eq("evidence_record_id", recordId).maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    if (existing.data.reviewer_id !== payload.reviewer_id) throw new Error("Evidence has already been reviewed by another facilitator.");
    const result = await supabase.from("evidence_reviews").update(payload).eq("id", existing.data.id);
    if (result.error) throw result.error;
  } else {
    const result = await supabase.from("evidence_reviews").insert(payload);
    if (result.error) throw result.error;
  }
}

export function useSupabaseFacilitatorWorkspace() {
  const { user } = useAuth();
  const verifiedAccess = useFacilitatorAccess();
  const [workspace, setWorkspace] = useState<SupabaseFacilitatorWorkspace | null>(null);
  const [loadedUserId, setLoadedUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    void loadSupabaseFacilitatorWorkspace(user.id, verifiedAccess ?? undefined).then(value => {
      if (!cancelled) {
        setWorkspace(value);
        setLoadedUserId(user.id);
        setError(null);
      }
    }).catch(() => {
      if (!cancelled) {
        setWorkspace(null);
        setLoadedUserId(user.id);
        setError("We couldn’t load your shared workspace. Please refresh and try again. If the problem continues, contact your institution administrator.");
      }
    });
    return () => { cancelled = true; };
  }, [user, verifiedAccess]);

  const activeWorkspace = user && loadedUserId === user.id ? workspace : null;
  const activeLoading = Boolean(user) && loadedUserId !== user.id;
  const activeError = user && loadedUserId === user.id ? error : null;
  return { workspace: activeWorkspace, loading: activeLoading, error: activeError };
}
