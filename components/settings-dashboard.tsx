"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, LockKeyhole, RotateCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLearningStore } from "@/lib/learning-store";
import { DEFAULT_PERSONALISATION, type Personalisation } from "@/lib/personalisation";
import { usePersonalisation } from "@/components/personalisation-provider";

const grades = [8, 9, 10, 11, 12];
const accents: Array<{ value: Personalisation["accent"]; label: string }> = [
  { value: "commerce", label: "Commerce" }, { value: "blue", label: "Blue" }, { value: "amber", label: "Amber" }, { value: "sage", label: "Sage" },
];

type Section = "profile" | "appearance" | "reading" | "account";

export function SettingsDashboard() {
  const { user } = useAuth();
  const { state, setProfile, syncError } = useLearningStore();
  const preferences = usePersonalisation();
  const [section, setSection] = useState<Section>("profile");
  const [name, setName] = useState(state.profile?.displayName ?? "");
  const [grade, setGrade] = useState(state.profile?.grade ?? state.activeGrade ?? 8);
  const [profileMessage, setProfileMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = setProfile({ displayName: name.trim(), grade });
    setProfileMessage(ok ? "Profile updated. Learning record sync will continue in the background." : "The profile could not be saved on this device. Please try again.");
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(""); setPasswordError("");
    if (!user) { setPasswordError("Sign in before changing account security settings."); return; }
    if (password.length < 8) { setPasswordError("Use at least 8 characters for the new password."); return; }
    if (password !== confirmPassword) { setPasswordError("The passwords do not match."); return; }
    setPasswordBusy(true);
    try {
      const result = await createClient().auth.updateUser({ password });
      if (result.error) throw result.error;
      setPassword(""); setConfirmPassword(""); setPasswordMessage("Password updated.");
    } catch {
      setPasswordError("The password could not be updated. Check the password requirements and try again.");
    } finally { setPasswordBusy(false); }
  }

  const sectionLabels: Array<{ value: Section; label: string; detail: string }> = [
    { value: "profile", label: "Profile", detail: "Name and learning grade" },
    { value: "appearance", label: "Appearance", detail: "Theme and accent" },
    { value: "reading", label: "Reading", detail: "Text size and page width" },
    { value: "account", label: "Account & security", detail: "Email and password" },
  ];

  return <main className="settings-page">
    <header className="settings-header">
      <Link href="/profile" className="settings-back"><ArrowLeft aria-hidden="true"/> Profile</Link>
      <p className="eyebrow">Applied Commerce</p>
      <h1>Settings</h1>
      <p className="settings-intro">Make Applied Commerce work better for the way you learn.</p>
      {preferences.loading ? <p className="settings-status" role="status">Loading saved preferences…</p> : null}
      {preferences.error ? <div className="settings-status settings-error" role="alert">{preferences.error}<button type="button" onClick={() => void preferences.reload()}>Retry</button></div> : null}
      {!preferences.error && !preferences.loading && preferences.saving ? <p className="settings-status" role="status">Saving preferences…</p> : null}
      {!preferences.error && !preferences.loading && !preferences.saving && preferences.message ? <p className="settings-status" role="status">{preferences.message}</p> : null}
    </header>

    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Settings categories">
        {sectionLabels.map(item => <button key={item.value} type="button" aria-current={section === item.value ? "page" : undefined} onClick={() => setSection(item.value)}><span>{item.label}</span><small>{item.detail}</small><ChevronRight aria-hidden="true"/></button>)}
      </nav>

      <section className="settings-content" aria-label={sectionLabels.find(item => item.value === section)?.label}>
        {section === "profile" ? <>
          <div className="settings-section-heading"><h2>Learning profile</h2><p>These details help Applied Commerce return you to the right learning context.</p></div>
          <form className="settings-form" onSubmit={saveProfile}>
            <label className="settings-row"><span>Preferred name</span><input maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder="Add your name" autoComplete="name"/></label>
            <label className="settings-row"><span>Current grade</span><select value={grade} onChange={event => setGrade(Number(event.target.value))}>{grades.map(value => <option key={value} value={value}>Grade {value}</option>)}</select></label>
            <button className="settings-primary" type="submit">Save profile <Check aria-hidden="true"/></button>
          </form>
          {profileMessage ? <p className="settings-feedback" role="status">{profileMessage}</p> : null}
          {syncError ? <p className="settings-feedback settings-error" role="alert">{syncError}</p> : null}
        </> : null}

        {section === "appearance" ? <>
          <div className="settings-section-heading"><h2>Appearance</h2><p>Choose a comfortable surface and accent. Your choice changes presentation only.</p></div>
          <label className="settings-row"><span>Theme</span><select value={preferences.personalisation.appearance} disabled={preferences.loading || preferences.saving || Boolean(preferences.error)} onChange={event => void preferences.update({ appearance: event.target.value as Personalisation["appearance"] })}><option value="system">Use device setting</option><option value="light">Light</option><option value="warm">Warm</option><option value="dark">Dark</option></select></label>
          <fieldset className="settings-row settings-accent"><legend>Accent colour</legend><div className="accent-options">{accents.map(item => <button key={item.value} type="button" className={`accent-choice accent-${item.value}`} aria-label={item.label} title={item.label} aria-pressed={preferences.personalisation.accent === item.value} disabled={preferences.loading || preferences.saving || Boolean(preferences.error)} onClick={() => void preferences.update({ accent: item.value })}><span aria-hidden="true"/></button>)}</div></fieldset>
          <button className="settings-reset" type="button" disabled={preferences.loading || preferences.saving || Boolean(preferences.error)} onClick={() => void preferences.update({ appearance: DEFAULT_PERSONALISATION.appearance, accent: DEFAULT_PERSONALISATION.accent })}><RotateCcw aria-hidden="true"/> Reset appearance</button>
        </> : null}

        {section === "reading" ? <>
          <div className="settings-section-heading"><h2>Reading</h2><p>Adjust the reading scale and content width for lessons and learning surfaces.</p></div>
          <label className="settings-row"><span>Text size</span><select value={preferences.personalisation.textSize} disabled={preferences.loading || preferences.saving || Boolean(preferences.error)} onChange={event => void preferences.update({ textSize: event.target.value as Personalisation["textSize"] })}><option value="small">Small</option><option value="standard">Standard</option><option value="large">Large</option><option value="extra_large">Extra large</option></select></label>
          <label className="settings-row"><span>Reading width</span><select value={preferences.personalisation.readingWidth} disabled={preferences.loading || preferences.saving || Boolean(preferences.error)} onChange={event => void preferences.update({ readingWidth: event.target.value as Personalisation["readingWidth"] })}><option value="narrow">Narrow</option><option value="standard">Standard</option><option value="wide">Wide</option></select></label>
          <div className="reading-preview" style={{ fontSize: `calc(16px * ${preferences.personalisation.textSize === "small" ? .92 : preferences.personalisation.textSize === "large" ? 1.14 : preferences.personalisation.textSize === "extra_large" ? 1.28 : 1})`, maxWidth: preferences.personalisation.readingWidth === "narrow" ? "32ch" : preferences.personalisation.readingWidth === "wide" ? "100%" : "42ch" }}><span>PREVIEW</span><p>Commerce is something you learn to use.</p><small>Your reading preferences apply across supported learning surfaces.</small></div>
          <button className="settings-reset" type="button" disabled={preferences.loading || preferences.saving || Boolean(preferences.error)} onClick={() => void preferences.update({ textSize: DEFAULT_PERSONALISATION.textSize, readingWidth: DEFAULT_PERSONALISATION.readingWidth })}><RotateCcw aria-hidden="true"/> Reset reading settings</button>
        </> : null}

        {section === "account" ? <>
          <div className="settings-section-heading"><h2>Account & security</h2><p>Account credentials stay managed by Supabase Authentication.</p></div>
          <div className="settings-account-row"><span>Email address</span><strong>{user?.email ?? "Not signed in"}</strong></div>
          {user ? <form className="settings-form settings-password-form" onSubmit={changePassword}>
            <h3><LockKeyhole aria-hidden="true"/> Change password</h3>
            <label className="settings-row"><span>New password</span><input type="password" minLength={8} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required/></label>
            <label className="settings-row"><span>Confirm password</span><input type="password" minLength={8} autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required/></label>
            <button className="settings-primary" type="submit" disabled={passwordBusy}>{passwordBusy ? "Updating…" : "Update password"}</button>
            {passwordMessage ? <p className="settings-feedback" role="status">{passwordMessage}</p> : null}
            {passwordError ? <p className="settings-feedback settings-error" role="alert">{passwordError}</p> : null}
          </form> : <p className="settings-feedback">Sign in to manage account security. <Link href="/auth">Go to sign in</Link></p>}
        </> : null}
      </section>
    </div>
  </main>;
}
