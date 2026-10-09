"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { emptyLearningState, parseLearningState } from "./response-identity";
import type { LearnerProfile, LearningState } from "./types";
import { useAuth } from "./auth-context";
import { reconcileLearningState, syncLearningState } from "./supabase/persistence";
import { createClient } from "./supabase/client";

const KEY = "applied-commerce-learning-state-v1";
const EVENT = "applied-commerce-learning-state-change";
const LEGACY_MIGRATION_KEY = `${KEY}-legacy-migrated-to-account`;
const emptyState=emptyLearningState;
const emptyRaw=JSON.stringify(emptyState);
const storageKeyFor=(userId:string|null|undefined)=>userId?`${KEY}:user:${userId}`:KEY;

function readRaw(key:string):string{
  if(typeof window==="undefined") return emptyRaw;
  return localStorage.getItem(key)??emptyRaw;
}
function parse(raw:string):LearningState{
  try{return parseLearningState(raw);}catch{return emptyState;}
}

function write(state: LearningState, key:string) {
  const existing=localStorage.getItem(key);
  if(existing){
    // Validate before overwriting, and retain an untouched pre-migration backup.
    const parsed=JSON.parse(existing);
    parseLearningState(existing);
    if(parsed.version===1&&!localStorage.getItem(`${key}-before-stable-prompts`)){
      localStorage.setItem(`${key}-before-stable-prompts`,existing);
    }
  }
  localStorage.setItem(key, JSON.stringify(state));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onStoreChange: () => void, key:string) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) onStoreChange();
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
  const storageKey=storageKeyFor(user?.id);
  const readCurrentRaw=useCallback(()=>readRaw(storageKey),[storageKey]);
  const subscribeCurrent=useCallback((onStoreChange:()=>void)=>subscribe(onStoreChange,storageKey),[storageKey]);
  const raw = useSyncExternalStore(subscribeCurrent, readCurrentRaw, () => emptyRaw);
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const state = useMemo(() => parse(raw), [raw]);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      remoteReady.current=true;
      return;
    }
    remoteReady.current=false;
    void (async()=>{
      const supabase=createClient();
      const adminResult=await supabase.rpc("is_platform_admin");
      if(adminResult.error)throw adminResult.error;

      // The pre-account local store was shared by every login on this device.
      // Preserve it, but claim it only for the platform administrator's own
      // account; never copy one account's local answers into another account.
      if(adminResult.data===true&&!localStorage.getItem(LEGACY_MIGRATION_KEY)&&!localStorage.getItem(storageKey)){
        const legacy=localStorage.getItem(KEY);
        if(legacy){
          parseLearningState(legacy);
          localStorage.setItem(storageKey,legacy);
          localStorage.setItem(LEGACY_MIGRATION_KEY,user.id);
        }
      }

      const accountState=parse(readRaw(storageKey));
      const merged=await reconcileLearningState(user.id,accountState);
      if(cancelled)return;
      write(merged,storageKey);
      setSyncError(null);
      remoteReady.current=true;
    })().catch(()=>{
      if(cancelled)return;
      setSyncError("We couldn’t sync your account just now. Your work is still saved on this device; check your connection and try again.");
      remoteReady.current=true;
    });
    return () => { cancelled = true; };
  // Reconcile only when the authenticated account changes; state changes are synced by the debounced adapter below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id,storageKey]);

  useEffect(() => {
    if (!user || !remoteReady.current) return;
    const timer = window.setTimeout(() => {
      void syncLearningState(user.id, state).then(() => setSyncError(null)).catch(() => {
        setSyncError("Your latest change is saved on this device but hasn’t reached your account yet. Check your connection and try again.");
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [state, user, storageKey]);

  const update = useCallback((fn: (current: LearningState) => LearningState) => {
    try{
      write(fn(parseLearningState(readRaw(storageKey))),storageKey);
      setSaveError(null);
      return true;
    }catch{
      setSaveError("Your latest change could not be saved on this device. Keep this page open and copy your work before leaving.");
      return false;
    }
  }, [storageKey]);

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
