"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "ios" | "android" | "desktop" | "other";

type PwaState = {
  ready: boolean;
  installed: boolean;
  canInstall: boolean;
  installing: boolean;
  platform: InstallPlatform;
  install: () => Promise<void>;
  message: string;
};

const PwaContext = createContext<PwaState | null>(null);

export function usePwaInstall() {
  const state = useContext(PwaContext);
  if (!state) throw new Error("PwaProvider is required.");
  return state;
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [offline, setOffline] = useState(false);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("other");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const refreshInstalled = () => setInstalled(displayMode.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const refreshConnection = () => setOffline(!navigator.onLine);
    const capturePrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    const didInstall = () => { setInstalled(true); setPrompt(null); setMessage("Applied Commerce is installed on this device."); };
    const frame = requestAnimationFrame(() => {
      refreshInstalled();
      refreshConnection();
      const agent = navigator.userAgent;
      const ios = /iPad|iPhone|iPod/.test(agent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      setPlatform(ios ? "ios" : /Android/.test(agent) ? "android" : /Windows|Macintosh|Linux|CrOS/.test(agent) ? "desktop" : "other");
      setReady(true);
    });
    displayMode.addEventListener("change", refreshInstalled);
    window.addEventListener("online", refreshConnection);
    window.addEventListener("offline", refreshConnection);
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", didInstall);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator && window.isSecureContext) {
      // Registration failures must not interrupt lessons or saving. Installation
      // remains a browser capability; a worker is not used as an auth/data store.
      void navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
    }
    return () => {
      cancelAnimationFrame(frame);
      displayMode.removeEventListener("change", refreshInstalled);
      window.removeEventListener("online", refreshConnection);
      window.removeEventListener("offline", refreshConnection);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", didInstall);
    };
  }, []);

  async function install() {
    if (!prompt || installing) return;
    setInstalling(true);
    setMessage("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(choice.outcome === "accepted" ? "Follow your browser’s steps to finish installing Applied Commerce." : "You can install later from your browser’s menu.");
    } catch {
      setMessage("Open your browser’s menu and choose Install app or Add to Home Screen.");
    } finally {
      setPrompt(null);
      setInstalling(false);
    }
  }

  return <PwaContext.Provider value={{ ready, installed, canInstall: Boolean(prompt), installing, platform, install, message }}>
    {offline ? <div className="pwa-offline-notice" role="status">You’re offline. Keep this lesson open to continue. Check the save status for your work; account sync and opening pages need a connection.</div> : null}
    {children}
  </PwaContext.Provider>;
}
