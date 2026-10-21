# Grade 8 Term 1 contextual classroom delivery · review report

Implementation is on `codex/classroom-v2-g8-term1-2026-10-21`, stacked on the owner-approved PR #43 implementation because main still predates that unmerged PR. Neither PR is merged by this work. This is a term review candidate, not approval to expand to another term.

The release contains 20 Grade 8 Term 1 plans and the four preserved higher-grade benchmarks, 31 periods and 1,867 instructional text fields. The term itself uses 25 periods; Lessons 1, 2, 3, 4 and 20 use two. All 620 original benchmark and clarification fields remain identical. Each field is accessible in preparation, a local teaching moment or a local later-learning disclosure. Complete print content is mounted only for printing. The original standalone benchmark guides remain available.

All 19 new term plans were written after reading their complete authored lessons. Examples of deliberate instructional differences include the 35-minute learning agreement; a two-direction money-flow audit with labelled unknowns; a fictional five-member rotational saving model; a twelve-contribution SMART arithmetic check; safe initiative and failure discussions; a routine with a protected minimum backup; and a two-period evidence-based portfolio review. These are private draft enrichments, not source-book edits or externally moderated teaching content.

## Verification recorded so far

| Check | Actual result |
| --- | --- |
| Pre-change Node baseline | 182 passed |
| Initial V2 Node suite | 186 passed |
| Runtime integrity | 395 lessons, four assessments, 20,766 stable raw blocks |
| Original classroom release | Five guides, seven periods, 100 Grade 8 fields and clarification release validated |
| V2 private release | 24 plans, 20 term lessons, 31 periods, 1,867 fields, 620 original/clarification fields preserved |
| Default learner renderer | All 399 units match the unchanged main-branch static-markup fixture |
| Source insertion proof | Every reviewed moment in all 24 plans rendered exactly once |
| Learner browser regression | 120/120 DOM comparisons and 120/120 screenshot pixel comparisons identical at all six widths |
| Python identity checks | Two passed using `python3 scripts/test_block_identity.py` |
| Initial typecheck, lint, build | Passed; final gates running after accessibility corrections |
| Public client disclosure scan | 77 assets checked against 2,421 raw/escaped private sentinels; no disclosure |
| 320-pixel smoke | Three passed: Lesson 1, approved Lesson 8, two-period Grade 12 |
| Desktop preparation/print/accessibility smoke | Passed after two reproduced accessibility corrections |
| Full V2 and existing acceptance matrices | IN PROGRESS; do not infer a pass from the smoke checks |

The first browser attempt found a test selector error: stable response IDs contain double colons. The test now uses a quoted ID attribute selector, preserving the identity itself. The first desktop accessibility scan reproduced skipped preparation heading levels and repeated transition landmark names. Both were corrected; the all-plan scan is the regression gate. Original failed logs and traces remain private.

## Security and release limits

The original key file is unchanged byte for byte. It was neither displayed nor regenerated. Private plaintext, screenshots, PDFs and traces stay in ignored private storage; only encrypted evidence may be committed. Server-side identity, active-session and current-role checks remain mandatory before any private import or decryption. The actual local-mode application denies the classroom API without opening an auth client. Synthetic authorised API tests and the isolated UI copy are explicitly not real-role validation.

`AC_ROLE_FIXTURES` is unset. Real staging educator access, real learner denial, revoked-role behaviour against Supabase and cloud persistence are **NOT TESTED**. The separate production project and production Supabase records are unchanged. No schema migration, security-policy change, source-book edit, response-key change, assessment change or Zimbabwe application change was made.

The provider integration confirms the staging project as `applied-commerce-sa-staging` / `prj_9MXnYeh3mxtFzcS1xzEDrTjOW2nP`, with deployment protection enabled. Staging deployment and hosted server-decryption verification will be recorded after the implementation gates complete. Deployment protection must not be described as application learner denial. No hosted educator review is claimed.

Independent educator moderation, a classroom timing pilot, current product/legal information where relevant and owner acceptance remain required. Source gaps in the educational register are distinct from fixed interface defects. Do not expand another grade-and-term batch until this term is reviewed.
