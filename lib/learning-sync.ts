import type { LearningState, LearnerProfile } from './types';

export type SyncKind = 'prompt' | 'note' | 'completion' | 'profile';
export type SyncValue = string | boolean | { displayName: string; grade: number | null };
export type SyncEntry = { kind: SyncKind; key: string; value: SyncValue; revision: number };
export type SyncChange = Omit<SyncEntry, 'revision'> & { expected: number };
export type SyncResult = SyncEntry & { conflict: boolean };
export type LearningSync = {
  profileAllowed?: boolean;
  openedAt?: string;
  baseline: Record<string, SyncEntry>;
  conflicts: Record<string, SyncEntry>;
  history?: Array<{ local: SyncEntry; remote: SyncEntry; resolvedAt: string }>;
};
export const syncId = (kind: SyncKind, key: string) => `${kind}:${key}`;
const same = (a: SyncValue | undefined, b: SyncValue | undefined) => a === b || (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null && a.displayName === b.displayName && a.grade === b.grade);
export function learningValues(state: LearningState): Record<string, Omit<SyncEntry, 'revision'>> {
  const values: Record<string, Omit<SyncEntry, 'revision'>> = {};
  const put = (kind: SyncKind, key: string, value: SyncValue) => { values[syncId(kind, key)] = { kind, key, value }; };
  for (const [key, value] of Object.entries(state.promptResponses)) put('prompt', key, value);
  for (const [key, value] of Object.entries(state.responses)) put('note', key, value);
  for (const key of new Set([...Object.keys(state.completed), ...Object.keys(state.completionUpdatedAt ?? {})])) put('completion', key, Boolean(state.completed[key]));
  if (state.profile) put('profile', 'self', { displayName: state.profile.displayName?.trim() ?? '', grade: state.profile.grade ?? null });
  return values;
}
function copy(state: LearningState): LearningState {
  return { ...state, promptResponses: { ...state.promptResponses }, promptResponseUpdatedAt: { ...state.promptResponseUpdatedAt }, responses: { ...state.responses }, responseUpdatedAt: { ...state.responseUpdatedAt }, completed: { ...state.completed }, completionUpdatedAt: { ...state.completionUpdatedAt }, completedMeta: { ...state.completedMeta }, sync: { ...state.sync, baseline: { ...state.sync?.baseline }, conflicts: { ...state.sync?.conflicts }, history: state.sync?.history } };
}
function apply(state: LearningState, entry: SyncEntry, source?: LearningState) {
  const { kind, key, value } = entry;
  if (kind === 'prompt') { state.promptResponses[key] = value as string; if(source?.promptResponseUpdatedAt?.[key])state.promptResponseUpdatedAt![key] = source.promptResponseUpdatedAt[key]; }
  if (kind === 'note') { state.responses[key] = value as string; if(source?.responseUpdatedAt?.[key])state.responseUpdatedAt![key] = source.responseUpdatedAt[key]; }
  if (kind === 'completion') {
    if (value) state.completed[key] = source?.completed[key] ?? state.completed[key] ?? new Date().toISOString(); else delete state.completed[key];
    state.completionUpdatedAt![key] = source?.completionUpdatedAt?.[key] ?? new Date().toISOString();
    if(source?.completedMeta?.[key])state.completedMeta![key] = source.completedMeta[key];
  }
  if (kind === 'profile') { const profile = value as { displayName: string; grade: number | null }; state.profile = { displayName: profile.displayName, grade: profile.grade ?? undefined } satisfies LearnerProfile; }
}
// Client clocks are display metadata only. Never use them to select a winner.
export function reconcileRemote(local: LearningState, remote: LearningState): LearningState {
  const next = copy(local), localValues = learningValues(local);
  next.sync!.profileAllowed=remote.sync?.profileAllowed;
  for (const [id, entry] of Object.entries(remote.sync?.baseline ?? {})) {
    const old = local.sync?.baseline[id], own = localValues[id];
    if (!own || (old && same(own.value, old.value)) || same(own.value, entry.value)) {
      apply(next, entry, remote); next.sync!.baseline[id] = entry; delete next.sync!.conflicts[id];
    } else if (!old || entry.revision !== old.revision) {
      next.sync!.conflicts[id] = entry;
    }
  }
  // A missing row is revision zero. Retain an old baseline to detect deletion,
  // rather than treating an offline edit as a fresh insertion.
  if (!local.lastOpened || (remote.lastOpened && remote.lastOpened.at > local.lastOpened.at)) next.lastOpened = remote.lastOpened;
  next.activeGrade = next.profile?.grade ?? next.lastOpened?.grade ?? remote.activeGrade ?? local.activeGrade;
  return next;
}
export function pendingChanges(state: LearningState): SyncChange[] {
  return Object.entries(learningValues(state)).flatMap(([id, entry]) => {
    const base = state.sync?.baseline[id];
    return state.sync?.conflicts[id] || (base && same(base.value, entry.value)) ? [] : [{ ...entry, expected: base?.revision ?? 0 }];
  });
}
// Read current local data when acknowledging; typing during a request survives.
export function acknowledge(current: LearningState, sent: SyncChange[], results: SyncResult[]): LearningState {
  const next = copy(current), values = learningValues(current);
  for (const result of results) {
    const id = syncId(result.kind, result.key), own = values[id];
    if (result.conflict && !same(own?.value, result.value)) { next.sync!.conflicts[id] = result; continue; }
    next.sync!.baseline[id] = result; delete next.sync!.conflicts[id];
    const request = sent.find(x => syncId(x.kind, x.key) === id);
    if (request && same(own?.value, request.value)) apply(next, result);
  }
  return next;
}
export function resolveConflict(state: LearningState, id: string, choice: 'local' | 'remote'): LearningState {
  const remote = state.sync?.conflicts[id], own = learningValues(state)[id];
  if (!remote || !own) return state;
  const next = copy(state);
  next.sync!.history = [...(state.sync?.history ?? []), { local: { ...own, revision: state.sync?.baseline[id]?.revision ?? 0 }, remote, resolvedAt: new Date().toISOString() }];
  next.sync!.baseline[id] = remote; delete next.sync!.conflicts[id];
  if (choice === 'remote') apply(next, remote);
  return next;
}
