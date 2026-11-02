# Applied Commerce UI Refinement Inventory

Scope: South African Applied Commerce repository, portfolio-first progressive-disclosure pass.
Current implementation: merged into `main`; this inventory records safeguards and remaining verification work.

| Area / exact component | Refinement | Default state | Accessibility, data, and workflow safeguards |
|---|---|---|---|
| Learner portfolio — `components/portfolio-dashboard.tsx`, rendered by `app/portfolio/page.tsx` | Captured activity response values are tucked away to reduce repeated detail. | Activity title, grade/term/lesson, and **Open lesson** remain visible. Response values are under “View captured responses” with a count. | Do not remove or rewrite `state.promptResponses`; retain stable response keys and lesson links. Native `details/summary` provides disclosure semantics and keyboard operation. |
| Lesson reading-session portfolio notices — `components/content-blocks.tsx`, `components/presentation-system.tsx`, `app/presentation.css` | Repeated explanatory notices are reduced to a compact disclosure. | Collapsed label is exactly **“Portfolio evidence”**. | Expanded state retains the authored instruction and “Your responses stay with this lesson on this device.” Do not hide response fields or assessment instructions. Native disclosure and visible keyboard focus are required. |
| Portfolio synthesis — `components/portfolio-synthesis.tsx` plus `app/learner-record.css` | Supporting responses, review state, feedback, interpretation, and next pathway are hidden until requested. | Conclusion, rationale, confidence, and “Supporting work (N)” remain visible. | Preserve all evidence links and review fields. Do not imply a synthesis is a definitive judgement. |
| Earlier answers — `components/portfolio-dashboard.tsx` | Legacy or unmatched responses are separated from current evidence. | Collapsed “Earlier answers kept for review” section with count. | Keep values intact; do not silently remap them to current prompts. Preserve review links where available and the missing-lesson fallback. |
| Personal notes — `components/portfolio-dashboard.tsx` | Saved notes no longer dominate the initial portfolio view. | Collapsed “Notes you chose to keep” section with count. | Do not change note persistence or lesson associations. Retain lesson links and note text on expansion. |
| Lesson reader — `components/lesson-reader.tsx`, `components/presentation-system.tsx` | Optional insight and secondary guidance remain an audit candidate. | No further changes without checking each content type. Core instruction, activities, response fields, and checkpoints stay visible. | Avoid hiding required instructions or assessment criteria; validate keyboard, mobile, and saved-response flows. |
| Facilitator workspace — `components/facilitator-workspace.tsx` | Detailed breakdowns remain an audit candidate. | Prioritise outstanding reviews and required actions; collapse secondary breakdowns only after a workflow audit. | Never conceal overdue/unreviewed items, verification needs, review status, or save failures. Preserve server/local review paths and role gates. |
| Learner record / institutional and platform administration | Exact components and data dependencies still need mapping. | No presentation changes until components, dependencies, and permissions are traced. | Verify institution isolation, role-based access, auditability, and operational actions before changing presentation. |

## Hardening checklist

- [ ] Verify saved prompt responses remain unchanged and render when each disclosure opens.
- [ ] Verify lesson portfolio notices start collapsed, retain instructions on expansion, and do not hide response fields.
- [ ] Verify synthesis conclusions, confidence, rationale, evidence links, facilitator feedback, interpretation, and next pathway remain available.
- [ ] Verify earlier/orphaned responses remain intact and separate from current answers.
- [ ] Verify personal notes remain intact and linked to lessons.
- [ ] Verify lesson links preserve grade, term, and unit destinations.
- [ ] Verify keyboard operation, visible focus, and expanded/collapsed semantics at desktop and mobile sizes.
- [ ] Run `npm run verify` and browser acceptance checks.
- [ ] Separately run authenticated end-to-end checks for saved responses, synthesis, facilitator feedback, historical answers, lesson navigation, and cross-account/institution access controls.

Status: UI refinement is merged. Static regression coverage is being strengthened on a follow-up branch. Authenticated runtime checks are not claimed as passed until actually executed.
