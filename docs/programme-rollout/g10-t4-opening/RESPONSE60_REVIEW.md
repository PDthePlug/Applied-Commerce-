# Lesson 60 response structure: owner-approved separate staging fix

Genuine staging password login confirms that the four existing horizons render as one flat group containing 24 options. Clicking one `Dependent` checks all four identical controls. A fresh password login reproduces the same ambiguity. The original synthetic value was restored. This is an existing response defect, not a learner-source inaccuracy or a passing acceptance result.

Affected lesson: `g10-t4-l60-060`; block `dfe0b8dcfd78fcd81bea25f0-1`; existing saved identity `g10-t4-l60-060::prompt-dfe0b8dcfd78fcd81bea25f0-1::choice`. See response60-diagnosis.json; authenticated capture remains protected and its hash is recorded separately.

Proposed separate staging fix:

- Keep the original question, four horizon labels, 24 authored options, source block and single saved answer identity.
- Present the four horizons separately so one selection can be saved for each horizon.
- Store a versioned structured string in that same answer field. Retain any previous flat answer verbatim as a previous combined answer; do not infer its horizon or migrate/delete it automatically.
- Show readable horizon labels and values in educator review, portfolio and print. Do not expose JSON metadata in learner-facing evidence.
- Preserve revision checks, permissions, focus and keyboard access. Verify each horizon independently through editing, clearing, reload and fresh genuine login; verify older combined answers, assigned educator review and unrelated/revoked denial.

This changes the response representation and goes beyond the authorised checkpoint presentation refinement. The owner-approved response fix is implemented for staging verification. No migration, new response key or source rewrite is applied. The owner explicitly approved implementing this separate staging fix on 2026-10-26, preserving older answers. Local and genuine hosted independent-choice, retained-answer, portfolio, educator-review and physical-print checks pass. See RESPONSE60_REPORT.md and RESPONSE60_RESULTS.json. Lesson 60 remains uncompleted until its guide and full acceptance pass; the other Term 4 lessons can proceed. If deferred, ordinary personal written working can support the original activity, but that does not demonstrate independent digital horizon persistence.
