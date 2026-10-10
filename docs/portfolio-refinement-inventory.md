# Applied Commerce UI Refinement Inventory

Scope: South African Applied Commerce repository, portfolio-first progressive-disclosure pass.
Branch: `refine/portfolio-progressive-disclosure`

| Area / exact component | Redundant or overly prominent content | Desired default state | Accessibility, data, and workflow risks / safeguards |
|---|---|---|---|
| Learner portfolio — `components/portfolio-dashboard.tsx`, rendered by `app/portfolio/page.tsx` | Every captured activity response is expanded as a full block, repeating lesson metadata and taking substantial vertical space. | Keep activity title, grade/term/lesson, and **Open lesson** visible. Collapse response values under a native disclosure labelled “View captured responses” with a response count. | Never remove or rewrite `state.promptResponses`; retain stable response keys and lesson links. Native `details/summary` preserves keyboard and screen-reader operation; visible summary and count communicate what is hidden. |
| Portfolio synthesis — `components/portfolio-synthesis.tsx` plus `app/learner-record.css` | Each synthesis conclusion immediately expands into supporting responses, review state, feedback, interpretation, and next pathway. | Keep conclusion, rationale, confidence, and a “Supporting work (N)” disclosure visible; detailed evidence starts collapsed. | Preserve every evidence link and review field. Ensure focus-visible treatment and semantic disclosure. Do not imply the conclusion is a definitive judgement. |
| Earlier answers — `components/portfolio-dashboard.tsx` | All unmatched or legacy responses are listed inline, making history compete with current evidence. | Collapsed “Earlier answers kept for review” section with count. Expand to inspect/copy answers and follow a lesson link when available. | Keep legacy values intact; do not silently remap them to current prompts. Preserve copy/review workflow and missing-lesson fallback. |
| Personal notes — `components/portfolio-dashboard.tsx` | All saved notes are shown in full regardless of whether the learner is looking for them. | Collapsed “Notes you chose to keep” section with count. | Do not change note persistence or lesson associations. Retain accessible lesson links and the note text on expansion. |
| Lesson reader — `components/lesson-reader.tsx`, `components/presentation-system.tsx` | Supplementary insight and potentially secondary guidance may compete with the main lesson flow. | Audit first; reuse existing `DeepeningInsightPanel` pattern only for optional material. Keep core instruction, activity, response fields, and checkpoints visible. | Avoid hiding required instructions or assessment criteria; validate keyboard, mobile, and saved-response flows before changes. |
| Facilitator workspace — `components/facilitator-workspace.tsx` | Detailed coverage breakdowns and supporting context may distract from review priorities. | Audit sections; prioritise outstanding reviews and required actions, collapse secondary breakdowns only where safe. | Never conceal overdue/unreviewed items, verification needs, review status, or save failures. Preserve server/local review paths and role gates. |
| Learner record / institutional and platform administration — component paths still to be traced | Candidate duplication: repeated evidence summaries, learner histories, and extended detail panels. | No implementation until exact components, data dependencies, and role permissions are mapped. | Verify institution isolation, role-based access, auditability, and any operational actions before changing presentation. |

## Portfolio-first regression checklist

- [ ] Saved prompt responses remain unchanged and render when disclosure opens.
- [ ] Portfolio synthesis conclusions, confidence labels, rationale, and supporting evidence remain present.
- [ ] Facilitator review status, feedback, portfolio interpretation, and next pathway remain accessible.
- [ ] Earlier/orphaned responses remain intact, separate from current answers, and reviewable.
- [ ] Personal notes remain intact and linked to their lessons.
- [ ] Open lesson / Review lesson links retain their existing grade, term, and unit destinations.
- [ ] Disclosure controls work by keyboard and expose expanded/collapsed state to assistive technology.
- [ ] Run repository verification: `npm run verify`, then authenticated end-to-end checks in the deployed/test environment.

Status: source changes prepared on a feature branch. Automated and authenticated runtime checks must be recorded separately; do not claim them as passed until actually executed.
