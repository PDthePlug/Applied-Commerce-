import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, School, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Deploy Applied Commerce",
  description: "Institutional deployment options for the Applied Commerce Grades 8–12 learning journey.",
};

const included = [
  "Grades 8–12 Applied Commerce learning journey",
  "Guided digital learner experience",
  "Activities, reflection, projects and assessments",
  "Automatic portfolio evidence capture",
  "Learner progress and completion records",
  "Facilitator and institutional visibility",
];

export default function DeployAppliedCommercePage() {
  return <div className="institutional-page institutional-detail-page">
    <Link className="institutional-back" href="/institutions"><ArrowLeft/> For institutions</Link>

    <section className="institutional-detail-hero">
      <p className="eyebrow">Offer 01 · Deploy Applied Commerce®</p>
      <h1>Economic agency and adult readiness, from Grade 8 to Grade 12.</h1>
      <p>
        Applied Commerce is a structured five-grade learning journey designed to help learners understand money, work,
        value, enterprise and opportunity by using what they learn in the real world.
      </p>
      <div className="institutional-actions">
        <Link className="institutional-primary" href="/institutions/demo">View institutional demo <ArrowRight/></Link>
        <Link className="institutional-text-link dark-link" href="/">Open learner platform <ArrowRight/></Link>
      </div>
    </section>

    <section className="institutional-detail-grid">
      <article>
        <p className="eyebrow">What institutions receive</p>
        <h2>More than access to content.</h2>
        <div className="institutional-check-list">
          {included.map(item=><span key={item}><Check/> {item}</span>)}
        </div>
      </article>
      <aside className="institutional-grade-journey">
        <span><strong>8</strong><small>Money, beliefs & observation</small></span>
        <span><strong>9</strong><small>Work, value & enterprise</small></span>
        <span><strong>10</strong><small>Systems & value creation</small></span>
        <span><strong>11</strong><small>Leadership, leverage & wealth</small></span>
        <span><strong>12</strong><small>Launch & transition</small></span>
      </aside>
    </section>

    <section className="institutional-pricing-section">
      <div className="institutional-section-heading">
        <p className="eyebrow">Launch commercial model</p>
        <h2>Start with a defined pilot, then scale.</h2>
        <p>These are current commercial anchors for early institutional conversations; larger deployments are scoped separately.</p>
      </div>
      <div className="institutional-pricing-grid">
        <article><School/><span>Pilot</span><strong>R45,000</strong><p>Single-grade, defined-cohort implementation.</p></article>
        <article><Users/><span>Institutional licence</span><strong>R150,000 / year</strong><p>Grades 8–12 for an agreed institutional scope.</p></article>
        <article><Users/><span>Sponsored deployment</span><strong>R325 / learner</strong><p>Useful for funded school or community access.</p></article>
      </div>
    </section>

    <section className="institutional-final-cta compact-cta">
      <p className="eyebrow">Proof before procurement</p>
      <h2>See how the learner journey connects to institutional evidence.</h2>
      <Link className="institutional-primary" href="/institutions/demo">Open the demo <ArrowRight/></Link>
    </section>
  </div>;
}
