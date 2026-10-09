import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Building2, ShieldCheck, UsersRound } from "lucide-react";
import { AuthPanel } from "@/components/auth-panel";
import { Brand } from "@/components/brand";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Securely access learner and staff workspaces in Applied Commerce.",
};

export default function AuthPage() {
  return <div className="auth-page">
    <header className="auth-header">
      <Brand subtitle="Learning & evidence platform" />
      <span className="auth-secure-label"><ShieldCheck aria-hidden="true" /> Secure account access</span>
    </header>

    <section className="auth-layout">
      <section className="auth-story">
        <p className="eyebrow">Applied Commerce · One account, distinct roles</p>
        <h1>Learning that connects to <em>real life.</em></h1>
        <p className="auth-story-lede">A single sign-in brings each person to the Applied Commerce experience they are authorised to use — from learning and portfolios to facilitation and programme operations.</p>

        <div className="auth-workspace-list">
          <article>
            <span className="auth-workspace-icon"><BookOpenCheck aria-hidden="true" /></span>
            <span><strong>Learner workspace</strong><small>Lessons, activities, progress and portfolio evidence.</small></span>
          </article>
          <article>
            <span className="auth-workspace-icon"><UsersRound aria-hidden="true" /></span>
            <span><strong>Facilitator workspace</strong><small>Assigned cohorts, learner responses and evidence review.</small></span>
          </article>
          <article>
            <span className="auth-workspace-icon"><Building2 aria-hidden="true" /></span>
            <span><strong>Workspace administration</strong><small>Institution, cohort, enrolment and staff operations for authorised accounts.</small></span>
          </article>
        </div>

        <p className="auth-access-note"><ShieldCheck aria-hidden="true" /><span>Access is role-based. Creating an account does not grant facilitator, institution or platform-administrator permissions.</span></p>
      </section>

      <section className="auth-entry" aria-label="Sign in or create an account">
        <AuthPanel />
        <div className="auth-entry-footer">
          <span>Looking for the workspace overview?</span>
          <Link href="/institutions">Explore Workspace <ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
    </section>

    <footer className="auth-footer">
      <span>Applied Commerce</span>
      <span>Learning · Action · Evidence · Opportunity</span>
    </footer>
  </div>;
}
