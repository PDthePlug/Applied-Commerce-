import type { LearningState } from "@/lib/types";
import type { TablesInsert } from "./database.types";
import { createClient } from "./client";

const CURRICULUM_VERSION = "runtime-3";

function emptyState(): LearningState {
  return { version: 2, previousResponses: {}, completed: {}, completedMeta: {}, responses: {}, promptResponses: {} };
}

function mergeLearningState(local: LearningState, remote: LearningState): LearningState {
  return { ...remote, ...local, version: 2,
    previousResponses: { ...remote.previousResponses, ...local.previousResponses },
    completed: { ...remote.completed, ...local.completed },
    completedMeta: { ...remote.completedMeta, ...local.completedMeta },
    responses: { ...remote.responses, ...local.responses },
    promptResponses: { ...remote.promptResponses, ...local.promptResponses },
    profile: local.profile ?? remote.profile,
    activeGrade: local.activeGrade ?? remote.activeGrade,
    lastOpened: local.lastOpened ?? remote.lastOpened };
}

export async function loadRemoteLearningState(userId: string): Promise<LearningState> {
  const supabase = createClient();
  const [profileResult, progressResult, promptResult, notesResult] = await Promise.all([
    supabase.from("learner_profiles").select("preferred_name,current_grade").eq("user_id", userId).maybeSingle(),
    supabase.from("lesson_progress").select("grade,term,unit_id,status,last_opened_at,updated_at").eq("learner_id", userId),
    supabase.from("prompt_responses").select("unit_id,prompt_key,response,updated_at").eq("learner_id", userId),
    supabase.from("lesson_notes").select("unit_id,note,updated_at").eq("learner_id", userId),
  ]);
  for (const result of [profileResult, progressResult, promptResult, notesResult]) if (result.error) throw result.error;
  const remote = emptyState();
  if (profileResult.data) { remote.profile = { displayName: profileResult.data.preferred_name ?? undefined, grade: profileResult.data.current_grade ?? undefined }; remote.activeGrade = profileResult.data.current_grade ?? undefined; }
  for (const row of progressResult.data ?? []) {
    if (row.status === "completed") remote.completed[row.unit_id] = row.updated_at;
    if (row.last_opened_at && (!remote.lastOpened || row.last_opened_at > remote.lastOpened.at)) { remote.lastOpened = { grade: row.grade, term: row.term, unitId: row.unit_id, at: row.last_opened_at }; remote.activeGrade = row.grade; }
  }
  for (const row of promptResult.data ?? []) remote.promptResponses[row.prompt_key] = typeof row.response === "string" ? row.response : JSON.stringify(row.response);
  for (const row of notesResult.data ?? []) remote.responses[row.unit_id] = row.note;
  return remote;
}

export async function reconcileLearningState(userId: string, local: LearningState) {
  const remote = await loadRemoteLearningState(userId);
  const merged = mergeLearningState(local, remote);
  await syncLearningState(userId, merged);
  return merged;
}

export async function syncLearningState(userId: string, state: LearningState) {
  const supabase = createClient();
  const now = new Date().toISOString();
  const profile: TablesInsert<"learner_profiles"> = { user_id: userId, preferred_name: state.profile?.displayName?.trim() || null, current_grade: state.profile?.grade ?? state.activeGrade ?? null };
  const profileResult = await supabase.from("learner_profiles").upsert(profile, { onConflict: "user_id" });
  if (profileResult.error) throw profileResult.error;

  const progressRows: TablesInsert<"lesson_progress">[] = Object.entries(state.completed).map(([unitId, completedAt]) => {
    const meta = state.completedMeta?.[unitId];
    return { learner_id: userId, curriculum_version: CURRICULUM_VERSION, grade: meta?.grade ?? state.activeGrade ?? 8, term: meta?.term ?? (state.lastOpened?.unitId === unitId ? state.lastOpened.term : 0), unit_id: unitId, status: "completed", started_at: completedAt, completed_at: completedAt, last_opened_at: state.lastOpened?.unitId === unitId ? state.lastOpened.at : completedAt, updated_at: completedAt };
  });
  if (progressRows.length) { const result = await supabase.from("lesson_progress").upsert(progressRows, { onConflict: "learner_id,curriculum_version,unit_id" }); if (result.error) throw result.error; }

  const noteRows: TablesInsert<"lesson_notes">[] = Object.entries(state.responses).filter(([, note]) => note.trim()).map(([unitId, note]) => ({ learner_id: userId, curriculum_version: CURRICULUM_VERSION, grade: state.activeGrade ?? 8, term: state.lastOpened?.unitId === unitId ? state.lastOpened.term : 0, unit_id: unitId, note, updated_at: now }));
  if (noteRows.length) { const result = await supabase.from("lesson_notes").upsert(noteRows, { onConflict: "learner_id,curriculum_version,unit_id" }); if (result.error) throw result.error; }

  const promptRows: TablesInsert<"prompt_responses">[] = Object.entries(state.promptResponses).map(([promptKey, response]) => {
    const unitId = promptKey.split("::")[0] || "unknown";
    return { learner_id: userId, curriculum_version: CURRICULUM_VERSION, grade: state.activeGrade ?? 8, term: state.lastOpened?.unitId === unitId ? state.lastOpened.term : 0, unit_id: unitId, prompt_key: promptKey, response, response_kind: "text", answered_at: now, updated_at: now };
  });
  if (promptRows.length) { const result = await supabase.from("prompt_responses").upsert(promptRows, { onConflict: "learner_id,curriculum_version,unit_id,prompt_key" }); if (result.error) throw result.error; }
}

export function mergeForTest(local: LearningState, remote: LearningState) { return mergeLearningState(local, remote); }
