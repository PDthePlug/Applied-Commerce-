"use client";

import { createContext, createElement, useContext, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { emptyLearningState, parseLearningState } from "./response-identity";
import type { LearnerProfile, LearningState } from "./types";
import { useAuth } from "./auth-context";
import { loadRemoteLearningState, syncLearningState } from "./supabase/persistence";
import { mergeLearningState } from "./learner-record";
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

function useLearningStoreState() {
  const [saveError,setSaveError]=useState<string|null>(null);
  const [syncError,setSyncError]=useState<string|null>(null);
  const remoteReady=useRef(false);
  const { user, loading: authLoading } = useAuth();
  const [readyAccount,setReadyAccount]=useState<string|null>(null);
  const syncQueue=useRef<Promise<unknown>>(Promise.resolve());
  const storageKey=storageKeyFor(user?.id);
  const readCurrentRaw=useCallback(()=>readRaw(storageKey),[storageKey]);
  const subscribeCurrent=useCallback((onStoreChange:()=>void)=>subscribe(onStoreChange,storageKey),[storageKey]);
  const raw = useSyncExternalStore(subscribeCurrent, readCurrentRaw, () => emptyRaw);
  const hydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const state = useMemo(() => parse(raw), [raw]);

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return;
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

      const remote=await loadRemoteLearningState(user.id);
      if(cancelled)return;
      // Read again after the request: answers typed while loading must survive.
      const merged=mergeLearningState(parseLearningState(readRaw(storageKey)),remote);
      write(merged,storageKey);
      setSyncError(null);
      remoteReady.current=true;
      setReadyAccount(user.id);
    })().catch(()=>{
      if(cancelled)return;
      setSyncError("We couldn’t sync your account just now. Your work is still saved on this device; check your connection and try again.");
      remoteReady.current=true;
      setReadyAccount(user.id);
    });
    return () => { cancelled = true; };
  // Reconcile only when the authenticated account changes; state changes are synced by the debounced adapter below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id,storageKey,authLoading]);

  useEffect(() => {
    if (!user || authLoading || readyAccount!==user.id || !remoteReady.current) return;
    let active=true;
    const timer = window.setTimeout(() => {
      // One queue per provider prevents overlapping snapshots arriving out of order.
      syncQueue.current=syncQueue.current.catch(()=>{}).then(async()=>{
        if(!active)return;
        await syncLearningState(user.id,parseLearningState(readRaw(storageKey)));
        if(active)setSyncError(null);
      }).catch(()=>{
        if(active)setSyncError("Your latest change is saved on this device but hasn’t reached your account yet. Check your connection and try again.");
      });
    }, 700);
    return () => {active=false;window.clearTimeout(timer);};
  }, [state, user, storageKey,authLoading,readyAccount]);

  const update = useCallback((fn: (current: LearningState) => LearningState) => {
    if(authLoading)return false;
    try{
      write(fn(parseLearningState(readRaw(storageKey))),storageKey);
      setSaveError(null);
      return true;
    }catch{
      setSaveError("Your latest change could not be saved on this device. Keep this page open and copy your work before leaving.");
      return false;
    }
  }, [storageKey,authLoading]);

  const markComplete = useCallback((unitId: string, complete=true, context?: {grade:number;term:number}) => update(current => {
    const completed={...current.completed};
    const completedMeta={...(current.completedMeta ?? {})};
    const at=new Date().toISOString();
    if(context)completedMeta[unitId]=context;
    if (complete) completed[unitId]=at;
    else delete completed[unitId];
    return {...current, completed, completedMeta,completionUpdatedAt:{...current.completionUpdatedAt,[unitId]:at}};
  }), [update]);

  const saveResponse = useCallback((unitId:string, value:string) => update(current => ({
    ...current, responses:{...current.responses,[unitId]:value},responseUpdatedAt:{...current.responseUpdatedAt,[unitId]:new Date().toISOString()}
  })), [update]);

  const savePromptResponse = useCallback((promptId:string, value:string) => update(current => ({
    ...current, promptResponses:{...current.promptResponses,[promptId]:value},promptResponseUpdatedAt:{...current.promptResponseUpdatedAt,[promptId]:new Date().toISOString()}
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

const LearningStoreContext=createContext<ReturnType<typeof useLearningStoreState>|null>(null);
export function LearningStoreProvider({children}:{children:React.ReactNode}){
  const value=useLearningStoreState();
  return createElement(LearningStoreContext.Provider,{value},children);
}
export function useLearningStore(){
  const store=useContext(LearningStoreContext);
  if(!store)throw new Error("LearningStoreProvider is required.");
  return store;
}
