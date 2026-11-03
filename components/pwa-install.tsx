"use client";

import { ChevronDown, Download } from "lucide-react";
import { usePwaInstall, type InstallPlatform } from "@/components/pwa-provider";

function InstallSteps({ platform }: { platform: InstallPlatform }) {
  if (platform === "ios") return <ol className="profile-install-steps">
    <li>Open Applied Commerce in <strong>Safari</strong> and tap <strong>Share</strong>.</li>
    <li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>
  </ol>;
  if (platform === "android") return <ol className="profile-install-steps">
    <li>Open your browser’s menu <span aria-label="three dots">⋮</span>.</li>
    <li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>, then confirm.</li>
  </ol>;
  if (platform === "desktop") return <ol className="profile-install-steps">
    <li>Open this site in <strong>Chrome</strong> or <strong>Edge</strong>.</li>
    <li>Choose the install icon in the address bar, or <strong>Install app</strong> in the browser menu.</li>
  </ol>;
  return <p>Open your browser’s menu and choose <strong>Install app</strong> or <strong>Add to Home Screen</strong>, if available.</p>;
}

export function ProfileInstall() {
  const pwa = usePwaInstall();
  if (!pwa.ready || pwa.installed) return null;

  return <details className="profile-install" onToggle={event => {
    if (event.currentTarget.open) event.currentTarget.scrollIntoView({ block: "nearest", behavior: "instant" });
  }}>
    <summary><Download aria-hidden="true"/><span>Install Applied Commerce</span><ChevronDown className="profile-install-chevron" aria-hidden="true"/></summary>
    <div className="profile-install-content">
      <p className="profile-install-label">Applied Commerce on your device</p>
      <h3>A place on your home screen</h3>
      <p>Open your learning space directly, in its own app window.</p>
      {pwa.canInstall ? <button className="profile-install-button" type="button" disabled={pwa.installing} onClick={() => void pwa.install()}>
        <Download aria-hidden="true"/>{pwa.installing ? "Installing…" : "Install Applied Commerce"}
      </button> : <InstallSteps platform={pwa.platform}/>}
      {pwa.message ? <p className="profile-install-message" role="status">{pwa.message}</p> : null}
      <details className="profile-install-help" onToggle={event => {
        if (event.currentTarget.open) event.currentTarget.scrollIntoView({ block: "nearest", behavior: "instant" });
      }}>
        <summary>What works offline?</summary>
        <p>Keep an open lesson on screen to continue. Work successfully saved on this device stays here, and pending account changes retry when you reconnect. Opening lessons and signing in need a connection; installation does not download the curriculum.</p>
      </details>
    </div>
  </details>;
}
