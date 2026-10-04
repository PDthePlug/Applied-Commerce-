"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { EvidenceReview } from "./types";

const KEY="applied-commerce-evidence-reviews-v1";
const EVENT="applied-commerce-evidence-reviews-change";
const EMPTY="{}";

function readRaw(){
  if(typeof window==="undefined") return EMPTY;
  return localStorage.getItem(KEY)??EMPTY;
}
function parse(raw:string):Record<string,EvidenceReview>{
  try{
    const value=JSON.parse(raw);
    return value&&typeof value==="object"?value:{};
  }catch{return {};}
}
function write(value:Record<string,EvidenceReview>){
  localStorage.setItem(KEY,JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
}
function subscribe(onChange:()=>void){
  const storage=(event:StorageEvent)=>{if(event.key===KEY) onChange();};
  window.addEventListener("storage",storage);
  window.addEventListener(EVENT,onChange);
  return ()=>{
    window.removeEventListener("storage",storage);
    window.removeEventListener(EVENT,onChange);
  };
}
const subscribeHydration=()=>()=>{};

export function useEvidenceReviewStore(){
  const raw=useSyncExternalStore(subscribe,readRaw,()=>EMPTY);
  const hydrated=useSyncExternalStore(subscribeHydration,()=>true,()=>false);
  const reviews=useMemo(()=>parse(raw),[raw]);

  const saveReview=useCallback((review:EvidenceReview)=>{
    write({...parse(readRaw()),[review.responseKey]:review});
  },[]);
  const removeReview=useCallback((responseKey:string)=>{
    const next={...parse(readRaw())};
    delete next[responseKey];
    write(next);
  },[]);
  return {reviews,hydrated,saveReview,removeReview};
}
