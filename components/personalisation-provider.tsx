"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { applyPersonalisation, DEFAULT_PERSONALISATION, normalisePersonalisation, type Personalisation } from "@/lib/personalisation";

type PersonalisationContextValue = {
  personalisation: Personalisation;
  loading: boolean;
  saving: boolean;
  error: string;
  message: string;
  update: (patch: Partial<Personalisation>) => Promise<void>;
  reload: () => Promise<void>;
};

const Context = createContext<PersonalisationContextValue | null>(null);
const localKey = (userId?: string) => `applied-commerce:personalisation:v1:${userId || "guest"}`;

function readLocal(userId?: string): Personalisation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(localKey(userId));
    return raw ? normalisePersonalisation(JSON.parse(raw) as Partial<Personalisation>) : null;
  } catch { return null; }
}

function writeLocal(value: Personalisation, userId?: string) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(localKey(userId), JSON.stringify(value)); } catch { /* Preferences still apply for this session. */ }
}

export function PersonalisationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [personalisation, setPersonalisation] = useState(DEFAULT_PERSONALISATION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const reload = useCallback(async () => {
    if (authLoading) return;
    const userId = user?.id;
    const local = readLocal(userId) ?? DEFAULT_PERSONALISATION;
    setPersonalisation(local);
    applyPersonalisation(local);
    setLoading(Boolean(userId));
    setError("");
    setMessage("");
    if (!userId) { setLoading(false); return; }
    try {
      const supabase = createClient();
      const result = await supabase.from("account_preferences").select("appearance,accent,text_size,reading_width").eq("user_id", userId).maybeSingle();
      if (result.error) throw result.error;
      const next = result.data ? normalisePersonalisation({ appearance: result.data.appearance, accent: result.data.accent, textSize: result.data.text_size, readingWidth: result.data.reading_width } as Partial<Personalisation>) : local;
      setPersonalisation(next);
      applyPersonalisation(next);
      writeLocal(next, userId);
    } catch {
      setError("Settings could not be loaded from this account. Retry to check the saved preferences.");
    } finally { setLoading(false); }
  }, [authLoading, user?.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void reload(); }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const update = useCallback(async (patch: Partial<Personalisation>) => {
    if (loading || saving || error) return;
    const userId = user?.id;
    const previous = personalisation;
    const next = normalisePersonalisation({ ...previous, ...patch });
    setPersonalisation(next);
    applyPersonalisation(next);
    writeLocal(next, userId);
    setMessage("");
    if (!userId) { setMessage("Saved on this device"); return; }
    setSaving(true);
    setError("");
    try {
      const supabase = createClient();
      const result = await supabase.from("account_preferences").upsert({
        user_id: userId,
        appearance: next.appearance,
        accent: next.accent,
        text_size: next.textSize,
        reading_width: next.readingWidth,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (result.error) throw result.error;
      setMessage("Saved to your account");
    } catch {
      setPersonalisation(previous);
      applyPersonalisation(previous);
      writeLocal(previous, userId);
      setError("That setting could not be saved. Your previous preferences have been restored.");
    } finally { setSaving(false); }
  }, [error, loading, personalisation, saving, user?.id]);

  const value = useMemo(() => ({ personalisation, loading: loading || authLoading, saving, error, message, update, reload }), [personalisation, loading, authLoading, saving, error, message, update, reload]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePersonalisation() {
  const value = useContext(Context);
  if (!value) throw new Error("usePersonalisation must be used inside PersonalisationProvider");
  return value;
}
