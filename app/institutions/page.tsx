import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, Building2, ChartBar, FileCheck2, Layers3, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "For Institutions",
  description: "Deploy Applied Commerce or turn an existing education programme into a measurable digital learning journey.",
};

const evidenceFlow = [
  ["01", "Learn", "Structured content, explanation and context."],
  ["02", "Act", "Activities move the learner from reading into doing."],
  ["03", "Evidence", "Relevant responses and artefacts are captured as learning happens."],
  ["04", "Portfolio", "Evidence accumulates into a longitudinal learner record."],
  ["05", "Report", "Facilitators and institutions can see participation, progress and proof."],
];

export default function InstitutionsPage() {
  return <div className="institutional-page">
    <section className="institutional-hero">
      <div className="institutional-hero-copy">
        <p className="eyebrow">Applied Commerce · For institutions</p>
        <h1>Learning should leave <em>evidence.</em></h1>
        <p className="institutional-hero-lede">
          Applied Commerce turns curriculum into guided digital learning journeys where learners do more than complete content.
          They act, reflect, produce evidence and build a record of what they have actually done.
        </p>
        <div className="institutional-actions">
          <Link className="institutional-primary" href="/institutions/demo">View the institutional demo <ArrowRight/></Link>
          <Link className="institutional-text-link" href="/institutions/manage">Open institution operations <ArrowRight/></Link>
          <a className="institutional-text-link" href="#offers">Explore the two offers <ArrowRight/></a>
        </div>
      </div>
      <aside className="institutional-proof-card">
        <span>One learning architecture</span>
        <strong>Curriculum → action → evidence → portfolio → reporting</strong>
        <p>Built first through the Applied Commerce Grades 8–12 learner experience, then designed to support other programmes too.</p>
        <div>
          <small><BookOpenCheck/> Guided learning</small>
          <small><FileCheck2/> Evidence capture</small>
          <small><ChartBar/> Institutional visibility</small>
        </div>
      </aside>
    </section>

    <section className="institutional-intro">
      <p className="eyebrow">Two commercial paths</p>
      <h2>Use our curriculum, or bring us yours.</h2>
      <p>
        Applied Commerce remains the flagship education product. The same underlying learning architecture can also turn an
        organisation&apos;s existing programme, workbook or curriculum into a persistent digital experience.
      </p>
    </section>

    <section className="institutional-offers" id="offers">
      <article className="institutional-offer-card deploy-card">
        <div className="institutional-offer-icon"><BookOpenCheck/></div>
        <p className="eyebrow">Offer 01</p>
        <h2>Deploy Applied Commerce®</h2>
        <p>Bring our Grades 8–12 economic agency and adult-readiness learning journey to your learners.</p>
        <ul>
          <li>Five-grade curriculum journey</li>
          <li>Digital activities, projects and reflection</li>
          <li>Automatic learner portfolio evidence</li>
          <li>Institutional progress and evidence reporting</li>
        </ul>
        <div className="institutional-fit">
          <span>Built for</span>
          <p>Schools · school groups · banks · foundations · corporate social-investment programmes</p>
        </div>
        <Link href="/institutions/deploy">Explore Applied Commerce deployment <ArrowRight/></Link>
      </article>

      <article className="institutional-offer-card digitise-card">
        <div className="institutional-offer-icon"><Layers3/></div>
        <p className="eyebrow">Offer 02</p>
        <h2>Digitise Your Programme</h2>
        <p>You already have the methodology. We turn it into a measurable, guided digital learning journey.</p>
        <ul>
          <li>Your curriculum, programme and brand</li>
          <li>Guided learner progression</li>
          <li>Evidence capture and portfolios</li>
          <li>Facilitator, cohort and programme visibility</li>
        </ul>
        <div className="institutional-fit">
          <span>Built for</span>
          <p>Youth programmes · NGOs · foundations · training organisations · education initiatives</p>
        </div>
        <Link href="/institutions/digitise">Explore programme digitisation <ArrowRight/></Link>
      </article>
    </section>

    <section className="institutional-evidence-section">
      <div className="institutional-section-heading">
        <p className="eyebrow">The difference</p>
        <h2>A completed module tells you someone reached the end. Evidence tells you what they did.</h2>
      </div>
      <div className="institutional-evidence-flow">
        {evidenceFlow.map(([number,title,detail])=><article key={number}>
          <span>{number}</span>
          <h3>{title}</h3>
          <p>{detail}</p>
        </article>)}
      </div>
    </section>

    <section className="institutional-operating-model">
      <div>
        <p className="eyebrow">From content to operating system</p>
        <h2>The learner experience is only one layer.</h2>
        <p>
          The institutional product is designed around the full delivery chain: learner, facilitator, cohort, programme
          management and sponsor visibility.
        </p>
      </div>
      <div className="institutional-layer-stack">
        <span><Sparkles/> Learner journey</span>
        <span><Building2/> Facilitator & cohort operations</span>
        <span><ChartBar/> Programme & sponsor reporting</span>
      </div>
    </section>

    <section className="institutional-final-cta">
      <p className="eyebrow">See the architecture</p>
      <h2>Switch between learner, facilitator, programme manager and sponsor views.</h2>
      <p>The demo uses illustrative data so the operating model is visible without implying real client results.</p>
      <div className="institutional-actions">
        <Link className="institutional-primary" href="/institutions/demo">Open institutional demo <ArrowRight/></Link>
        <Link className="institutional-text-link dark-link" href="/institutions/manage">Manage a live institution <ArrowRight/></Link>
      </div>
    </section>
  </div>;
}
