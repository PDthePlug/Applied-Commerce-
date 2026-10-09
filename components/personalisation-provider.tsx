"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
  const requestGeneration = useRef(0);

  const reload = useCallback(async () => {
    if (authLoading) return;
    const generation = ++requestGeneration.current;
    setSaving(false);
    const userId = user?.id;
    const local = readLocal(userId) ?? DEFAULT_PERSONALISATION;
    setPersonalisation(local);
    applyPersonalisation(local);
    setLoading(Boolean(userId));
    setError("");
    setMessage("");
    if (!userId) { setLoading(false); return; }
    try {
      const response = await fetch("/api/preferences", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || typeof payload !== "object" || !("preferences" in payload)) throw new Error("Preferences are unavailable.");
      if (generation !== requestGeneration.current) return;
      const next = normalisePersonalisation(payload.preferences as Partial<Personalisation>);
      setPersonalisation(next);
      applyPersonalisation(next);
      writeLocal(next, userId);
    } catch {
      if (generation === requestGeneration.current) setError("Settings could not be loaded from this account. Retry to check the saved preferences.");
    } finally { if (generation === requestGeneration.current) setLoading(false); }
  }, [authLoading, user?.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void reload(); }, 0);
    return () => window.clearTimeout(timer);
  }, [reload]);

  const update = useCallback(async (patch: Partial<Personalisation>) => {
    if (loading || saving || error) return;
    const generation = ++requestGeneration.current;
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
      const response = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-ac-expected-user-id": userId },
        body: JSON.stringify(next),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload || typeof payload !== "object" || !("preferences" in payload)) throw new Error("Preferences could not be saved.");
      if (generation !== requestGeneration.current) return;
      const saved = normalisePersonalisation(payload.preferences as Partial<Personalisation>);
      setPersonalisation(saved);
      applyPersonalisation(saved);
      writeLocal(saved, userId);
      setMessage("Saved to your account");
    } catch {
      if (generation === requestGeneration.current) {
        setPersonalisation(previous);
        applyPersonalisation(previous);
        writeLocal(previous, userId);
        setError("That setting could not be saved. Your previous preferences have been restored.");
      }
    } finally { if (generation === requestGeneration.current) setSaving(false); }
  }, [error, loading, personalisation, saving, user?.id]);

  const value = useMemo(() => ({ personalisation, loading: loading || authLoading, saving, error, message, update, reload }), [personalisation, loading, authLoading, saving, error, message, update, reload]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function usePersonalisation() {
  const value = useContext(Context);
  if (!value) throw new Error("usePersonalisation must be used inside PersonalisationProvider");
  return value;
}
