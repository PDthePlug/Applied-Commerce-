"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PwaState = {
  installed: boolean;
  canInstall: boolean;
  install: () => Promise<void>;
  message: string;
};

const PwaContext = createContext<PwaState | null>(null);

export function PwaProvider({ children }: { children: ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [offline, setOffline] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const displayMode = window.matchMedia("(display-mode: standalone)");
    const refreshInstalled = () => setInstalled(displayMode.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const refreshConnection = () => setOffline(!navigator.onLine);
    const capturePrompt = (event: Event) => { event.preventDefault(); setPrompt(event as InstallPromptEvent); };
    const didInstall = () => { setInstalled(true); setPrompt(null); setMessage("Applied Commerce is installed on this device."); };
    refreshInstalled();
    refreshConnection();
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
      displayMode.removeEventListener("change", refreshInstalled);
      window.removeEventListener("online", refreshConnection);
      window.removeEventListener("offline", refreshConnection);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", didInstall);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    setPrompt(null);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(choice.outcome === "accepted" ? "Follow your browser’s steps to finish installing Applied Commerce." : "You can install later from your browser’s menu.");
    } catch {
      setMessage("Open your browser’s menu and choose Install app or Add to Home Screen.");
    }
  }

  return <PwaContext.Provider value={{ installed, canInstall: Boolean(prompt), install, message }}>
    {offline ? <div className="pwa-offline-notice" role="status">You’re offline. Keep this lesson open to continue. Check the save status for your work; account sync and opening pages need a connection.</div> : null}
    {children}
  </PwaContext.Provider>;
}

export function PwaInstallSettings() {
  const pwa = useContext(PwaContext);
  if (!pwa) return null;
  return <>
    <div className="settings-section-heading"><h2>Install Applied Commerce</h2><p>Keep Applied Commerce on your home screen and open it in its own app window.</p></div>
    {pwa.installed ? <p className="settings-feedback" role="status">Applied Commerce is running as an installed app.</p> : <>
      {pwa.canInstall ? <button className="settings-primary" type="button" onClick={() => void pwa.install()}>Install Applied Commerce</button> : null}
      <p className="settings-feedback">On Android or a computer, open your browser’s menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>. If the option is missing, open this site in Chrome or Edge.</p>
      <p className="settings-feedback">On iPhone or iPad, open this site in Safari, tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</p>
    </>}
    {pwa.message ? <p className="settings-feedback" role="status">{pwa.message}</p> : null}
    <div className="settings-section-heading"><h2>When your connection drops</h2><p>Keep the current lesson open. Work successfully saved on this device remains here, and pending account changes retry when you reconnect. Opening pages, loading lessons, sign-in and staff tools need an internet connection. Installing the app does not download the curriculum.</p></div>
  </>;
}
