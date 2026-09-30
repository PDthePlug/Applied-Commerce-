"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { LearnerProfile, LearningState } from "./types";

const KEY = "applied-commerce-learning-state-v1";
const EVENT = "applied-commerce-learning-state-change";
const emptyState: LearningState = { version: 1, completed: {}, responses: {}, promptResponses: {} };
const emptyRaw = JSON.stringify(emptyState);

function readRaw(): string {
  if (typeof window === "undefined") return emptyRaw;
  return localStorage.getItem(KEY) ?? emptyRaw;
}

function parse(raw: string): LearningState {
  try {
    const value = JSON.parse(raw) as Partial<LearningState>;
    if (value.version !== 1) return emptyState;
    return {
      version: 1,
      activeGrade: value.activeGrade,
      completed: value.completed ?? {},
      responses: value.responses ?? {},
      promptResponses: value.promptResponses ?? {},
      profile: value.profile ?? {},
      lastOpened: value.lastOpened,
    };
  } catch {
    return emptyState;
  }
}

function write(state: LearningState) {
  localStorage.setItem(KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onStoreChange);
  };
}

const subscribeHydration = () => () => {};

export function useLearningStore() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => emptyRaw);
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const state = useMemo(() => parse(raw), [raw]);

  const update = useCallback((fn: (current: LearningState) => LearningState) => {
    write(fn(parse(readRaw())));
  }, []);

  const markComplete = useCallback((unitId: string, complete=true) => update(current => {
    const completed={...current.completed};
    if (complete) completed[unitId]=new Date().toISOString(); else delete completed[unitId];
    return {...current, completed};
  }), [update]);

  const saveResponse = useCallback((unitId:string, value:string) => update(current => ({
    ...current, responses:{...current.responses,[unitId]:value}
  })), [update]);

  const savePromptResponse = useCallback((promptId:string, value:string) => update(current => ({
    ...current, promptResponses:{...current.promptResponses,[promptId]:value}
  })), [update]);

  const setProfile = useCallback((patch:Partial<LearnerProfile>) => update(current => {
    const profile={...(current.profile ?? {}),...patch};
    return {...current,profile,activeGrade:profile.grade ?? current.activeGrade};
  }), [update]);

  const setLastOpened = useCallback((grade:number, term:number, unitId:string) => update(current => ({
    ...current, activeGrade:grade, lastOpened:{grade,term,unitId,at:new Date().toISOString()}
  })), [update]);

  const completedIds = useMemo(() => new Set(Object.keys(state.completed)), [state.completed]);
  return {state, hydrated, completedIds, markComplete, saveResponse, savePromptResponse, setProfile, setLastOpened};
}
