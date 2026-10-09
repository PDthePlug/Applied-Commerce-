# Applied Commerce learner portfolio evidence framework

## Source-of-truth audit

Reuse the current evidence and learning model rather than introducing a parallel portfolio database:

- `lesson_progress`: lesson status and timestamps. Completion is a participation/progression signal, not proof of competence.
- `prompt_responses`: learner-authored activity, reflection, table and other structured responses, tied to curriculum release and unit.
- `lesson_notes`: learner-owned notes; useful context, but not scored evidence by themselves.
- `assessment_attempts`: assessment attempt, submission/review status, score and result. This table exists but currently has no staging rows.
- `evidence_definitions`: curriculum prompt metadata including domains, evidence kind, assessment mode, rubric and portfolio eligibility. The table exists but currently has no staging rows.
- `evidence_records`: response-level evidence with automatic check result and workflow status.
- `evidence_reviews`: facilitator status, rubric criteria, feedback and review timestamps. Portfolio interpretation and next-pathway fields extend this existing table.
- `portfolio_artifacts` and `portfolio_evidence`: curated artifact-to-response links. Reuse for curated portfolio artifacts; do not duplicate raw responses.
- `evidence_report_snapshots`: existing report snapshot surface for future durable report versions; not required for the live deterministic synthesis.

The staging schema audit found 5 lesson-progress rows and 9 prompt-response rows, but zero assessment attempts, evidence definitions, evidence records, evidence reviews, portfolio artifacts or portfolio-evidence links at audit time. That means staging can validate response and completion ingestion, but it cannot yet substantiate reviewed-competency or verified-transfer claims from stored review records. The curriculum itself currently generates evidence definitions in application code; do not infer that the empty database definitions table is populated.

## Six-section portfolio narrative

1. **Growth — what is changing.** Compare dated evidence that measures the same capability. Without comparable observations, state that there is insufficient evidence to describe change.
2. **Evidence — the work behind the story.** Link directly to the source lesson/activity and show review state. Distinguish saved responses from accepted/verified evidence.
3. **Competency — what the evidence supports.** Use facilitator-reviewed evidence and defined rubric criteria. An automatic presence check, lesson completion, or single response cannot establish broad mastery.
4. **Progression — supported to independent to transfer.** Use explicit, dated rubric observations across contexts. Do not derive levels or percentages from completion counts.
5. **Remaining edge — what is not consistent yet.** Surface explicit revision feedback or identify a missing evidence opportunity. Missing data means “not yet evidenced”, not “learner cannot do this”.
6. **Next pathway — the next useful learning experience.** Prefer a facilitator recommendation; otherwise suggest a cautious next evidence opportunity based on the gap. Facilitators should be able to validate/correct the interpretation and record the next pathway in the existing evidence review.

## Confidence and missingness

- **High evidence confidence:** at least three accepted/verified evidence items across at least two learning contexts. This is confidence in evidence coverage, not a mastery rating.
- **Moderate evidence confidence:** at least one accepted/verified item, or a larger unreviewed body of work.
- **Limited evidence confidence:** a small amount of unreviewed evidence.
- **Insufficient evidence:** no relevant saved evidence, or no accepted/verified evidence for a competency claim.

These labels describe the strength of the available evidence, not the learner’s worth or ability. Each section can have a different confidence label. Contradictory, stale or unreviewed evidence should lower confidence. A facilitator correction should take precedence over an automatically drafted competency interpretation, and a facilitator next pathway should take precedence over the generic suggestion.

## Privacy for institution administrators

Institution administrators receive aggregate cohort indicators only. The aggregate loader considers active cohort enrolments only and suppresses derived learning metrics for cohorts with fewer than five active learners. It returns counts and coverage (completion, saved responses, review coverage and revision workload), not learner names, individual answers or learner-level scores. These metrics are operational signals, not rankings or competency conclusions.

## Current staging case check (2026-10-09)

The existing staging learner has 9 saved prompt responses across four unit IDs and 5 lesson-progress records. The nine response rows share the same recorded update timestamp. The assigned facilitator and learner are linked to the same active test cohort, which currently has only one active learner. There are no persisted assessment attempts, evidence records, evidence reviews, or portfolio artifact links.

Expected synthesis for this real staging state:

- **Evidence:** report the nine saved responses across four learning contexts, with direct links to the originating activities.
- **Competency:** not yet confirmed; none of the responses has a persisted facilitator review.
- **Growth:** insufficient dated/comparable reviewed observations; the shared timestamp cannot show change over time.
- **Progression and transfer:** not established; multiple completed or saved contexts are not a substitute for reviewed application.
- **Remaining edge:** unknown until a facilitator reviews the work; do not label a learner weakness from missing review records.
- **Next pathway:** a cautious suggestion to review the existing work and then apply a method in another context; a facilitator should replace this with a specific recommendation after review.
- **Institution view:** the cohort learning summary must remain suppressed because there is only one active learner, below the privacy threshold of five.

A synthetic regression test mirrors these counts and timestamp limitations. It is a rule test, not a claim that the test fixture is an actual learner record. No review has been inserted on behalf of a facilitator; that validation requires the assigned facilitator to authenticate and make a real professional judgement.

## Validation boundary

The synthesis is deterministic and evidence-linked, but staging currently has no persisted facilitator reviews or portfolio links. Therefore reviewed competency and transfer logic must be rechecked after real facilitator reviews exist. Browser validation must include learner, facilitator and institution-admin roles; no production schema changes or PR merge are implied by the staging implementation.
