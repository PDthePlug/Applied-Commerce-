export type PortfolioConfidence = "high" | "moderate" | "low" | "insufficient";

export type PortfolioEvidence = {
  id: string;
  title: string;
  href: string;
  unitId: string;
  domain: string[];
  response: string;
  reviewedStatus?: "pending" | "accepted" | "needs-revision" | "verified";
  portfolioInterpretation?: string;
  nextPathway?: string;
};

export type PortfolioSection = {
  key: "growth" | "evidence" | "competency" | "progression" | "edge" | "pathway";
  title: string;
  conclusion: string;
  confidence: PortfolioConfidence;
  rationale: string;
  evidence: PortfolioEvidence[];
};

export function buildPortfolioSynthesis(evidence: PortfolioEvidence[]): PortfolioSection[] {
  const ordered = [...new Map(evidence.map(item => [item.id, item])).values()];
  const accepted = ordered.filter(item => item.reviewedStatus === "accepted" || item.reviewedStatus === "verified");
  const revisions = ordered.filter(item => item.reviewedStatus === "needs-revision");
  const facilitatorInterpretation = [...ordered].reverse().find(item => item.portfolioInterpretation?.trim())?.portfolioInterpretation?.trim();
  const facilitatorPathway = [...ordered].reverse().find(item => item.nextPathway?.trim())?.nextPathway?.trim();
  const contexts = new Set(ordered.map(item => item.unitId));
  const domains = [...new Set(accepted.flatMap(item => item.domain))];
  const transfer = domains.some(domain => new Set(accepted.filter(item => item.domain.includes(domain)).map(item => item.unitId)).size > 1);
  const confidence: PortfolioConfidence = accepted.length >= 3 && contexts.size > 1 ? "high" : accepted.length || ordered.length >= 3 ? "moderate" : ordered.length ? "low" : "insufficient";
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  return [
    { key: "growth", title: "Growth — what is changing", conclusion: ordered.length > 1 ? "There are multiple saved responses, but a specific improvement is not claimed without dated, comparable reviewed evidence." : "There is not yet enough comparable evidence to describe growth.", confidence: ordered.length > 1 ? "low" : "insufficient", rationale: "Completion alone is not proof of growth; comparison needs consistent criteria or facilitator interpretation.", evidence: [first, last].filter((item, index, list): item is PortfolioEvidence => Boolean(item) && list.findIndex(other => other?.id === item?.id) === index) },
    { key: "evidence", title: "Evidence — the work behind the story", conclusion: ordered.length ? `${ordered.length} saved response(s) across ${contexts.size} learning context(s) can be inspected.` : "No saved responses are available to support a portfolio interpretation yet.", confidence, rationale: `${accepted.length} item(s) are accepted or verified; ${revisions.length} item(s) need revision. Unreviewed work shows participation, not confirmed competence.`, evidence: ordered },
    { key: "competency", title: "Competency — what the evidence supports", conclusion: facilitatorInterpretation || (accepted.length ? `Reviewed work currently supports developing capability in ${domains.join(", ") || "the reviewed evidence areas"}.` : "Competency is not yet confirmed because saved responses have not been accepted or verified by a facilitator."), confidence: accepted.length >= 3 ? "moderate" : accepted.length ? "low" : "insufficient", rationale: "A saved answer or presence check is not a substitute for rubric-based review and demonstrated application.", evidence: accepted },
    { key: "progression", title: "Progression — from supported work to independence", conclusion: accepted.length >= 2 && contexts.size > 1 ? "Reviewed evidence appears in multiple contexts; independence and consistency still need explicit criteria across those contexts." : "The evidence does not yet establish progression to independent, consistent application.", confidence: accepted.length >= 2 && contexts.size > 1 ? "moderate" : "insufficient", rationale: "No numeric progression level is inferred from completion counts. Levels require defined criteria and dated observations.", evidence: accepted },
    { key: "edge", title: "Remaining edge — what is not consistent yet", conclusion: revisions.length ? `${revisions.length} reviewed item(s) need revision; use the linked feedback to identify the next improvement.` : !transfer && accepted.length ? "The clearest evidence gap is transfer: the same capability has not yet been verified in a second context." : ordered.length && !accepted.length ? "Facilitator review is still missing, so the learner’s specific remaining edge is not yet known." : ordered.length ? "No specific unresolved edge is recorded. This does not prove that every capability is consistent." : "The first step is to capture a meaningful response that can be reviewed.", confidence: revisions.length ? "moderate" : "low", rationale: "Missing evidence is a gap, not proof of learner failure or proof that a capability is absent.", evidence: revisions.length ? revisions : accepted },
    { key: "pathway", title: "Next pathway — the next useful learning experience", conclusion: facilitatorPathway || (revisions.length ? "Revisit the linked activity, use facilitator feedback, and submit a revision." : !transfer ? "Apply the same method in a different real-world context and compare the new work with the current evidence." : "Apply the method to a new problem and ask for review against the same criteria."), confidence: accepted.length || revisions.length ? "moderate" : "low", rationale: "This is an evidence-informed suggestion; a facilitator should confirm fit with the learner’s curriculum and circumstances.", evidence: revisions.length ? revisions : accepted },
  ];
}
