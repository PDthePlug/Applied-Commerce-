"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { emptyLearningState, parseLearningState } from "./response-identity";
import type { LearnerProfile, LearningState } from "./types";
import { useAuth } from "./auth-context";
import { reconcileLearningState, syncLearningState } from "./supabase/persistence";

const KEY = "applied-commerce-learning-state-v1";
const EVENT = "applied-commerce-learning-state-change";
const emptyState=emptyLearningState;
const emptyRaw=JSON.stringify(emptyState);

function readRaw():string{
  if(typeof window==="undefined") return emptyRaw;
  return localStorage.getItem(KEY)??emptyRaw;
}
function parse(raw:string):LearningState{
  try{return parseLearningState(raw);}catch{return emptyState;}
}

function write(state: LearningState) {
  const existing=localStorage.getItem(KEY);
  if(existing){
    // Validate before overwriting, and retain an untouched pre-migration backup.
    const parsed=JSON.parse(existing);
    parseLearningState(existing);
    if(parsed.version===1&&!localStorage.getItem(`${KEY}-before-stable-prompts`)){
      localStorage.setItem(`${KEY}-before-stable-prompts`,existing);
    }
  }
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
  const [saveError,setSaveError]=useState<string|null>(null);
  const [syncError,setSyncError]=useState<string|null>(null);
  const remoteReady=useRef(false);
  const { user } = useAuth();
  const raw = useSyncExternalStore(subscribe, readRaw, () => emptyRaw);
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const state = useMemo(() => parse(raw), [raw]);

  useEffect(() => {
    let cancelled = false;
    if (!user) { remoteReady.current=true; return; }
    remoteReady.current=false;
    void reconcileLearningState(user.id, state).then(merged => {
      if (cancelled) return;
      write(merged);
      setSyncError(null);
      remoteReady.current=true;
    }).catch(error => {
      if (cancelled) return;
      setSyncError(error instanceof Error ? error.message : "Your account could not be synced. Your local work is still on this device.");
      remoteReady.current=true;
    });
    return () => { cancelled = true; };
  // Reconcile only when the authenticated learner changes; state changes are synced by the debounced adapter below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user || !remoteReady.current) return;
    const timer = window.setTimeout(() => {
      void syncLearningState(user.id, state).then(() => setSyncError(null)).catch(error => {
        setSyncError(error instanceof Error ? error.message : "Your latest change is saved on this device but could not reach your account.");
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [state, user]);

  const update = useCallback((fn: (current: LearningState) => LearningState) => {
    try{
      write(fn(parseLearningState(readRaw())));
      setSaveError(null);
      return true;
    }catch{
      setSaveError("Your latest change could not be saved on this device. Keep this page open and copy your work before leaving.");
      return false;
    }
  }, []);

  const markComplete = useCallback((unitId: string, complete=true, context?: {grade:number;term:number}) => update(current => {
    const completed={...current.completed};
    const completedMeta={...(current.completedMeta ?? {})};
    if (complete) { completed[unitId]=new Date().toISOString(); if (context) completedMeta[unitId]=context; }
    else { delete completed[unitId]; delete completedMeta[unitId]; }
    return {...current, completed, completedMeta};
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
  return {state, hydrated, saveError, syncError: user ? syncError : null, completedIds, markComplete, saveResponse, savePromptResponse, setProfile, setLastOpened, signedIn: Boolean(user)};
}
