"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { appliedCommerceBackendMode } from "@/lib/backend/config";

type AuthContextValue = { user: User | null; session: Session | null; loading: boolean };
const AuthContext = createContext<AuthContextValue>({ user: null, session: null, loading: true });

export function isSupabaseConfigured() {
  return appliedCommerceBackendMode()==="supabase";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(() => isSupabaseConfigured());

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    let active = true;
    let authEventReceived = false;
    let generation=0;
    const verify=(nextSession:Session|null)=>{
      const attempt=++generation;
      // Run outside onAuthStateChange: awaiting Auth operations inside that
      // callback can deadlock the Supabase client lock.
      queueMicrotask(()=>{void (async()=>{
        if(!nextSession)return;
        const result=await supabase.rpc("has_active_session");
        if(!active||attempt!==generation)return;
        if(!result.error&&!result.data){setSession(null);await supabase.auth.signOut({scope:"local"});}
      })().catch(()=>{});});
    };
    const checkCurrent=()=>{void supabase.auth.getSession().then(({data})=>verify(data.session));};
    window.addEventListener("focus",checkCurrent);
    window.addEventListener("online",checkCurrent);
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      authEventReceived = true;
      setSession(nextSession);
      verify(nextSession);
      setLoading(false);
    });
    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!active) return;
      if (!authEventReceived) {setSession(sessionData.session);verify(sessionData.session);}
      setLoading(false);
    }).catch(() => {
      if (!active) return;
      if (!authEventReceived) setSession(null);
      setLoading(false);
    });
    return () => { active = false;generation++;window.removeEventListener("focus",checkCurrent);window.removeEventListener("online",checkCurrent);data.subscription.unsubscribe(); };
  }, []);

  const value = useMemo(() => ({ user: session?.user ?? null, session, loading }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }
