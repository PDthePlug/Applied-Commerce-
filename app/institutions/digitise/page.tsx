import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, FileText, Layers3, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Digitise Your Programme",
  description: "Turn existing curriculum and programme intellectual property into a measurable digital learning journey.",
};

const stages = [
  ["01", "Map", "We map the programme structure, outcomes, delivery rhythm, learner tasks and facilitator role."],
  ["02", "Translate", "Existing manuals, workbooks and activities become a guided digital learner journey."],
  ["03", "Instrument", "Relevant learner actions become evidence, portfolio items, checkpoints and programme signals."],
  ["04", "Operate", "Facilitators and programme teams receive cohort-level visibility rather than disconnected spreadsheets."],
  ["05", "Report", "Sponsors and leaders can see reach, participation, completion and evidence without reading raw attendance sheets."],
];

export default function DigitiseProgrammePage() {
  return <div className="institutional-page institutional-detail-page">
    <Link className="institutional-back" href="/institutions"><ArrowLeft/> For institutions</Link>

    <section className="institutional-detail-hero digitise-hero">
      <p className="eyebrow">Offer 02 · Digitise Your Programme</p>
      <h1>Your programme already has value. Give it a digital operating system.</h1>
      <p>
        We turn established education and youth-development intellectual property into a persistent learner experience with
        guided progression, evidence capture, facilitator operations and programme reporting.
      </p>
      <div className="institutional-actions">
        <Link className="institutional-primary" href="/institutions/demo">View the platform architecture <ArrowRight/></Link>
      </div>
    </section>

    <section className="institutional-materials">
      <div>
        <FileText/>
        <p className="eyebrow">What you may have today</p>
        <h2>PDFs, workbooks, facilitator guides, PowerPoints, forms and spreadsheets.</h2>
      </div>
      <ArrowRight className="institutional-transform-arrow"/>
      <div className="institutional-material-output">
        <Layers3/>
        <p className="eyebrow">What it becomes</p>
        <h2>One guided, measurable programme journey.</h2>
      </div>
    </section>

    <section className="institutional-conversion-section">
      <div className="institutional-section-heading">
        <p className="eyebrow">Conversion architecture</p>
        <h2>From programme material to programme infrastructure.</h2>
      </div>
      <div className="institutional-conversion-grid">
        {stages.map(([number,title,detail])=><article key={number}>
          <span>{number}</span><h3>{title}</h3><p>{detail}</p>
        </article>)}
      </div>
    </section>

    <section className="institutional-ip-section">
      <div>
        <ShieldCheck/>
        <p className="eyebrow">IP model</p>
        <h2>Your curriculum remains yours.</h2>
        <p>
          The organisation retains ownership of its original curriculum, methodology and brand. Applied Commerce retains the
          reusable platform engine, system architecture and common product infrastructure.
        </p>
      </div>
      <div className="institutional-check-list">
        <span><Check/> Client curriculum ownership preserved</span>
        <span><Check/> Branded programme experience</span>
        <span><Check/> Reusable platform architecture</span>
        <span><Check/> Ongoing licence, hosting and support model</span>
      </div>
    </section>

    <section className="institutional-pricing-section">
      <div className="institutional-section-heading">
        <p className="eyebrow">Indicative implementation bands</p>
        <h2>Built as product infrastructure, not ordinary web development.</h2>
      </div>
      <div className="institutional-pricing-grid">
        <article><span>Focused conversion</span><strong>R150k–R250k</strong><p>One defined programme with a focused operating model.</p></article>
        <article><span>Programme operating system</span><strong>R250k–R500k</strong><p>Deeper roles, evidence, cohort management and reporting.</p></article>
        <article><span>Enterprise</span><strong>R500k+</strong><p>Multiple programmes, integrations or larger organisational infrastructure.</p></article>
      </div>
    </section>

    <section className="institutional-final-cta compact-cta">
      <p className="eyebrow">The demonstration</p>
      <h2>See one platform through four institutional perspectives.</h2>
      <Link className="institutional-primary" href="/institutions/demo">Open institutional demo <ArrowRight/></Link>
    </section>
  </div>;
}
