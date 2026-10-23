# Grade 8 Term 1 contextual classroom delivery

All 20 Grade 8 Term 1 lessons now use the approved contextual teaching architecture, including the original Lesson 8 benchmark. The four existing Grade 9–12 benchmarks also use the reusable interface. This is a completed implementation for owner and educator review; real authenticated-role validation and independent educational acceptance remain outstanding.

The release contains 24 plans, 31 periods and 1,867 instructional text fields. The term itself has 25 periods: Lessons 1, 2, 3, 4 and 20 use two 45-minute periods. Other term lessons use one. All 620 original benchmark and clarification fields are preserved exactly, including the approved Grade 8 guide's 100 fields and 24 clarification fields. No teaching field is accessible only through a fallback document.

## Classroom delivery

Educators prepare from an opening collapsed disclosure, then teach from the original learner material. Variable teaching stages, period selection, explicit revisits, local deeper support, understanding checks and later/optional activities replace a fixed five-stage implementation. Printing mounts a complete private guide temporarily; the live lesson has no duplicated full-length guide at the bottom. The original standalone benchmark guides remain available, and the 19 new plans have a working standalone view.

The 19 new plans were written after reading each complete authored lesson. Deliberate differences include the original 35-minute learning agreement, a labelled money-flow audit, a fictional rotational-saving model, the twelve-contribution SMART arithmetic check, safe initiative/failure activities, a routine with a protected minimum backup, and a two-period evidence-based portfolio review. These are private draft enrichments. See the [term overview](TERM_OVERVIEW.md), [teaching standard](TEACHING_STANDARD_V2.md), [24 field-by-field coverage maps](coverage/) and [educational-quality register](educational-quality-register.json).

Every reviewed insertion is verified against the actual semantic renderer. Lesson 20 needs an explicit placement exception: the existing renderer suppresses Activity 27's heading/prompts although a portfolio notice survives. Its teaching review is placed at the next intact Activity 28 section, with both source references and a documented rationale. No suppressed learner field is restored, moved or renumbered. Current classroom supporting disclosures have an explicit owning stage and add no minutes; the approved Lesson 8 24-hour experiment remains later work.

## Actual verification

| Check | Recorded result |
| --- | --- |
| Final application commit | `bdf432246cd73be42908724bed728a2f6f4dc4d2` |
| Node tests | 189 passed locally and in GitHub CI; initial pre-change baseline was 182 |
| Python identity tests | Two passed locally and in CI |
| Typecheck, lint and production build | Passed locally and in CI |
| Existing Playwright acceptance | 222 passed in final-code CI, 3.7 minutes |
| Six-viewport discovery | 390 passed; 480 diagnostic observations across 66 routes, no runtime/console/HTTP or unexpected request failures |
| Contextual teaching matrix | All 150 latest per-case outcomes pass after disclosed failures and focused retests; 24 lessons × six widths plus six privacy cases |
| All-plan desktop regression before scaffold consolidation | 25 passed in 5.5 minutes: all 24 plans plus privacy; includes actual stored response-key recovery for workbook controls without DOM IDs |
| Final scaffold consolidation | 36 passed in 6.0 minutes: all five changed benchmarks plus privacy at every width; preserved table fields appear once in their actual cells |
| Earlier focused built-code retest | 12 passed: Grade 12 benchmark and private-state lifecycle at every width |
| Approved Lesson 8 regression | 24 passed across six widths, including local preservation, notes/portfolio, fallback, private print, projection, dark/enlarged text and lifecycle checks |
| Default learner renderer | All 399 units match the unchanged main-branch markup fixture |
| Term learner browser comparisons | 120/120 DOM hashes and 120/120 screenshot pixel comparisons identical against the approved pre-rollout PR #43 build |
| Runtime integrity | 395 lessons, four assessments, 20,766 unchanged stable raw blocks |
| V2 release integrity | 24 plans; all 1,867 fields placed; all 620 original/clarification fields preserved |
| Public client disclosure scan | 77 assets, 2,421 raw/escaped private sentinels, zero disclosures |
| Complete print exports | 24/24 pass; 169 populated A4 pages within 12 mm margins; all 1,867 instructional fields survive exported PDF text |
| Original key | Preserved byte for byte; never displayed or regenerated |
| Real authenticated roles and cloud persistence | **NOT TESTED**: isolated `AC_ROLE_FIXTURES` unavailable |

[Actual results](actual-test-results.json), [CI evidence](ci-evidence.json), [teaching coverage](teaching-coverage-matrix.json), [route/viewport coverage](discovery-coverage-matrix.json), [print geometry](print-verification.json), [PDF text preservation](pdf-field-preservation.json), [security/role report](SECURITY_AND_ROLES.md) and [encrypted review evidence](EVIDENCE.md) provide inspectable records. The viewport widths are 320, 360, 430, 768, 1280 and 1920 pixels.

The final scaffold consolidation is retested separately across all five benchmarks and six widths. PDF text preservation accepts either layout or logical drawing-order extraction: one wrapped table heading interleaves in layout-only extraction, while its complete text is preserved in logical table-cell order. No instructional field was edited for the test.

The initial full teaching run passed 143 cases and failed seven: six failures came from an ambiguous alert selector while fixture sync warnings were also present; one exposed duplicate region names on the Grade 12 source tables. These results are retained, not recast as a clean first run. Focused retests passed. Interrupted earlier local sessions have no completion report and are not counted as passes. GitHub CI independently proves the existing 222-case acceptance suite on the final application commit.

Six reproduced interface defects are corrected in the [severity-ranked register](defect-register.json): skipped preparation heading level, repeated transition landmark names, a suppressed source heading treated as a visible insertion point, an extra blank print page, and repeated source-table region names during teaching, and scaffold labels repeated as paragraphs before their table. Preserved scaffold field identities now belong to the actual header/body cells beside the relevant practice, including in print. The source-table landmark correction applies only to annotated delivery; learner markup stays identical. The print regression now suppresses the route announcer during private printing and checks all exported pages. Test-harness corrections are separated from product defects.

Discovery also recorded 600 repeated small-target heuristics. Triage identified four assessment routes' invisible 13-pixel native radios; their visible labelled choice rows are the actual pointer targets. Eight mobile/desktop route checks confirmed at least 44-pixel targets and successful label selection. This is recorded in [target triage](discovery-target-triage.json), with no assessment changes. Automated checks do not constitute complete WCAG certification or a human screen-reader assessment.

## Staging and review

Draft [PR #44](https://github.com/PDthePlug/Applied-Commerce-/pull/44) is on `codex/classroom-v2-g8-term1-2026-10-21`, stacked on the owner-approved PR #43 branch `codex/contextual-teacher-g8-l8-2026-10-21` because main still predates that unmerged work. Neither PR is merged.

The final application is READY at **https://applied-commerce-sa-staging-iki6enora.vercel.app**. Deployment `dpl_3aK1svGBxqDBuqXRNWyi5ZnBSeVF` belongs to staging project `prj_9MXnYeh3mxtFzcS1xzEDrTjOW2nP`, commit `bdf4322`. Its production environment belongs only to this staging project. The server build decrypted and validated all 24 plans without exporting the existing Secret. Health returned 200 with the same commit and isolated project `inxshlumnhcgiahxqewe`. The anonymous classroom request returned 401 without private content; deployment protection may intercept, so this is not real learner-denial evidence. See [staging evidence](staging-evidence.json).

For owner review, open `/learn/8`, select Term 1, then a lesson. An authorised educator can enter Teacher View after server authorisation. Start with Lesson 8 to compare the approved benchmark, Lesson 1 for two-period delivery and Lesson 20 for portfolio continuity. Hosted educator access has not been claimed as passed.

The separate live production project, production Supabase records, canonical books, original lesson identities, four assessments, learner completion/response/portfolio models and Zimbabwe application are unchanged. The evidence/report commit may follow the application commit; staging deliberately identifies the tested application SHA above.

## Outstanding acceptance dependencies

Real staging educator/learner/admin/institution testing, revoked roles and cloud persistence require isolated authenticated fixtures. Independent educator moderation, normal-classroom timing pilots, review of the registered source accuracy/privacy gaps, owner acceptance and human assistive-technology evaluation remain required. The educational register separates proposed source improvements from implementation defects; canonical content was not silently corrected.

Use the [owner/educator review checklist](OWNER_EDUCATOR_REVIEW.md) to record named reviewers and dispositions. Do not proceed to another term, merge either PR or promote to the separate live production project until authorised.
