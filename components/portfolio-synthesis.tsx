"use client";
import Link from "next/link";
import { buildPortfolioSynthesis, type PortfolioEvidence } from "@/lib/portfolio-synthesis";

export function PortfolioSynthesis({ evidence }: { evidence: PortfolioEvidence[] }) {
  const sections = buildPortfolioSynthesis(evidence);
  const confidenceLabel = (value: string) => value === "high" ? "Strong evidence" : value === "moderate" ? "Some evidence" : value === "low" ? "Limited evidence" : "Evidence needed";

  return <section className="portfolio-synthesis" aria-labelledby="portfolio-synthesis-title">
    <header>
      <p className="eyebrow">Evidence-led reflection</p>
      <h2 id="portfolio-synthesis-title">What the learning record can tell us</h2>
      <p>Each conclusion is deliberately cautious and links back to the work behind it. Missing evidence is shown as a gap, not as a judgement about the learner.</p>
    </header>
    <div className="portfolio-synthesis-grid">
      {sections.map(section => <article className="portfolio-synthesis-card" key={section.key}>
        <div className="portfolio-synthesis-heading">
          <h3>{section.title}</h3>
          <span data-confidence={section.confidence}>{confidenceLabel(section.confidence)}</span>
        </div>
        <p>{section.conclusion}</p>
        <small>{section.rationale}</small>
        {section.evidence.length > 0 && <details className="portfolio-synthesis-evidence">
          <summary>Supporting work ({section.evidence.length})</summary>
          <div className="portfolio-synthesis-evidence-list">
            {section.evidence.map(item => <Link href={item.href} key={item.id}>
              <span>{item.title}</span>
              <small>{item.domain.join(" · ") || "Learning evidence"}{item.reviewedStatus ? ` · ${item.reviewedStatus.replace("-", " ")}` : " · Not yet reviewed"}</small>
              <span aria-hidden="true">↗</span>
              <p>{item.response.length > 240 ? item.response.slice(0, 240) + "…" : item.response}</p>
              {item.feedback ? <small>Facilitator feedback: {item.feedback}</small> : null}
              {item.portfolioInterpretation ? <small>Facilitator interpretation: {item.portfolioInterpretation}</small> : null}
              {item.nextPathway ? <small>Next pathway: {item.nextPathway}</small> : null}
            </Link>)}
          </div>
        </details>}
      </article>)}
    </div>
  </section>;
}
