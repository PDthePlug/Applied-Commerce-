"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { LearningState } from "./types";

const KEY = "applied-commerce-learning-state-v1";
const emptyState: LearningState = { version: 1, completed: {}, responses: {} };

function read(): LearningState {
  if (typeof window === "undefined") return emptyState;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState;
    const parsed = JSON.parse(raw) as LearningState;
    return parsed.version === 1 ? parsed : emptyState;
  } catch { return emptyState; }
}

function write(state: LearningState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function useLearningStore() {
  const [state, setState] = useState<LearningState>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setState(read()); setHydrated(true); }, []);

  const update = useCallback((fn: (current: LearningState) => LearningState) => {
    setState(current => { const next=fn(current); write(next); return next; });
  }, []);

  const markComplete = useCallback((unitId: string, complete=true) => update(current => {
    const completed={...current.completed};
    if (complete) completed[unitId]=new Date().toISOString(); else delete completed[unitId];
    return {...current, completed};
  }), [update]);

  const saveResponse = useCallback((unitId:string, value:string) => update(current => ({
    ...current, responses:{...current.responses,[unitId]:value}
  })), [update]);

  const setLastOpened = useCallback((grade:number, term:number, unitId:string) => update(current => ({
    ...current, activeGrade:grade, lastOpened:{grade,term,unitId,at:new Date().toISOString()}
  })), [update]);

  const completedIds = useMemo(() => new Set(Object.keys(state.completed)), [state.completed]);
  return {state, hydrated, completedIds, markComplete, saveResponse, setLastOpened};
}
