# Proposed learner workbook hardening — verification and acceptance record

Implementation: `b59dec5794117bf02dc22d4464e365112ea8ac17` (semantic mapping completed at `87ed1bd`), based on merged `main` `ab52273eae7d5d459c77e30a9d7bfdea8d8540ff`. PR: [#91](https://github.com/PDthePlug/Applied-Commerce-/pull/91). This record distinguishes implementation verification from owner curriculum acceptance. No production application merge or deployment has been performed.

## Coverage and review

The [interaction inventory](interaction-inventory.json) covers all 399 effective reader units and 20,742 blocks. The runtime verifier independently confirms 395 lessons, four assessments and all 20,766 original compiled blocks. These counts have different scopes: the unchanged Grade 9 Term 2 reader normalisation removes editorial metadata before display. No source blocks were removed by this change.

The [defect register](defect-register.json) contains 1,221 findings, including the unresolved editorial cases. It records source text, original IDs/index, grade/term/lesson, route, classification, severity, correction, response impact and review outcome. Findings can overlap at one block; their count is not a count of defective lessons. The [wrap register](wrap-coverage.json) includes all 395 lesson IDs, source references/fingerprints, original closing disposition, placement and next lesson. All 395 drafts have different takeaways, manually drafted against the source concepts/objectives. The shared component has no generic-copy fallback. Four assessments retain their assessment flow without a lesson wrap.

The explicit light theme also had a desktop lesson-map contrast failure, corrected with a slightly darker muted colour scoped to that rail. Final screenshot review caught fixed-size “I can” prefixes beside enlarged answers; they now use the same text-scale token, with a browser assertion at 200%. The source review identified 383 deeper sections, 315 source-directed deeper reflections, 50 additional explicit Architect's Questions outside those sections, seven Final Checkpoints with lost task context, ten missing confidence annotations, five circling tasks, four skill categories and 29 actually rendered duplicate instruction inputs. Six distinct adjacent written tasks remain editable, including a full cover letter, personal statement and investment red line. Three time projections now have separate destinations at the original block. Fifteen embedded conceptual questions remain reading pending educational review; none was made a compulsory answer.

Every lesson received a source/closing/copy review and automated structural/source-identity checks. Browser interaction reviews target the mandatory cases and representative complex work in every grade; this is not a claim that a human educator has individually moderated 395 wraps. Owner moderation of the TSV copy remains required.

## Verification results

The actual original/proposed field census is retained in [rendered-before.json](rendered-before.json) and [rendered-after.json](rendered-after.json), with input IDs and accessible names for every unit. Learner values are omitted. Final machine-readable results and evidence hashes are in [verification.json](verification.json). Commands and repeatable suites are in [README.md](README.md). Results below must be read with their stated source revision and scope.

| Gate | Scope | Result |
| --- | --- | --- |
| Runtime/source identities | 395 lessons + 4 assessments; original compiled blocks | PASS |
| Node regressions | 240 tests, including all wraps, deeper panels, stable/legacy keys, final checkpoints, named questions and 29 retired inputs | PASS |
| Block identity Python tests | 2 tests | PASS |
| TypeScript, ESLint, production builds | Local backend plus isolated staging build | PASS |
| Focused workbook browser suite | 24 journeys across 320, 360, 430, 768, 1280, 1920px; final application revision `b59dec5` | PASS |
| Focused WCAG audit | 36 actual browser axe scans; three high-risk lessons × six widths × light/dark; 200% text | PASS: zero violations |
| Touch interaction | Six real touch-emulation journeys at 320/360/430, light/dark | PASS: select/change/clear/reload preserves text |
| Existing browser regressions | 252 journeys; [CI evidence](https://github.com/PDthePlug/Applied-Commerce-/actions/runs/41482135977) | PASS: final application revision |
| Additional UI audit | 390 journeys across six widths; implementation `b6d516b` | PASS |
| Full reader browser census | All 399 units; 36 six-width screenshots; semantic revision `87ed1bd` | PASS: zero page errors / overflow |
| Genuine role/RLS HTTP checks | 37 staging checks, including revision/session/RLS denials | PASS |
| Genuine saved-record browser journeys | Four journeys; desktop 1280 / mobile 360; primary + advanced evidence | PASS: all original 62 financial fields plus ranking/rating, written/marked/legacy answers |
| Hosted contextual Teacher View | Seven lessons; 58 navigation targets; 168 layouts; six role checks; three persistence outcomes | PASS |
| Teacher PDF text | 14 integrated/standalone PDFs; 684 expected fields | PASS: zero missing fields; two educator-review PDFs also retain readable markers |

The final presentation corrections adjust the scoped lesson-map colour and annotated-statement text scaling. Full-curriculum census results retain their exact semantic-revision scope; the focused workbook, accessibility, touch, CI and authenticated staging checks cover the final application revision.

### Route × viewport × role matrix

| Surface | Actor / data | Widths | What was exercised |
| --- | --- | --- | --- |
| Landing, sign-in/reset, library/maps, reader, progress, portfolio, profile/settings, institution and facilitator shells | Local synthetic state | 320, 360, 430, 768, 1280, 1920 | Existing UI sweep, navigation, errors, responsive bounds and accessibility checks |
| Every lesson and assessment | Local learner | 1280 | Actual DOM, input census, wrap/disclosure counts, page errors and horizontal overflow |
| G8 L3 / L16; G9 L1/L7; G10 L46; G11 L10/L22; G12 L5/L53; four assessments | Local synthetic learner | All six widths | Real typing/selection, keyboard clear, persistence/reload/navigation, light/dark 200% text, mobile bounds and screenshots |
| G8 L3/L16, G11 explicit labelled question, G10 ranking, G11 rating, all 62 authored Grade 12 currency/allocation cells | Real isolated staging learner, fresh password sessions | 360, 1280 | API saves, independent keys, clearing, collapsed saves, reload, empty-storage fresh login, advanced values |
| Evidence review | Assigned educator, other learner, unassigned educator | 360, 1280 | Readable markers, same evidence keys, other-account denial, private review PDF |
| Seven released classroom guides | Real assigned staging educator | All six widths; light/dark × 100/200% | Source placement, navigation, deepening coexistence, no overflow, integrated print, standalone guide and learner presentation |
| Private classroom API | Platform/school admins, learner, other learner, unassigned educator; revoked educator session | Real staging HTTP/browser | Correct 200/403/401 boundaries; fixture-only revocation/restoration |

## Saved-response integrity

No Supabase migration, table/column/RPC change, RLS change, destructive operation or learner-data reset is included. The existing revision-aware persistence contract is reused. Every original authored block and response key remains valid. New confidence values use `annotation-confidence` at the corresponding source-row identity, independently of `blank-0`. Circling uses the existing original response slot when available; new annotation-only selections have their own source-bound slot. Markers remain learner-owned in Teacher View.

Splitting a response preserves the earlier combined `response` value in an inspectable previous-answer disclosure. Instruction fields retired from editing preserve earlier text there and in portfolio evidence. Retired trailing helper slots remain inspectable without renumbering preceding slots. No original written value is copied into a different learner's record or overwritten by a marker. Lesson synthesis adds no response field, completion requirement or claim that a future experiment has already happened.

Staging journeys use real saved records in dedicated synthetic accounts on `inxshlumnhcgiahxqewe`, not production learners or mocked Supabase responses. Records survive navigation/reload and a fresh browser password login with empty local storage. Synthetic evidence was retained across implementation revisions rather than cleared to make the tests pass. The current authorised teacher sees the same marker/ranking/rating/table evidence; unrelated users are denied. Private credentials, session state, raw evidence exports and teacher PDFs remain outside Git in a mode-700 directory. This public report contains aggregate results only.

## Teacher View and print

The approved classroom architecture, encrypted releases, source bindings and original guide fields remain intact. All 395 section anchors are checked structurally. Hosted high-risk examples are G8 L3, L16 and L20; G9 L1; G10 L46; G11 L22; G12 L53. Stage navigation is clicked to reach each actual teaching target. The preparation remains above the lesson, adjacent guidance stays source-bound, deeper disclosures coexist and the final conclusion includes the wrap. Learner presentation disables inputs and makes no private classroom request. Standalone and integrated teacher print are checked against original guide fields, not just PDF existence.

Learner PDFs include closed deeper-learning explanations, saved responses and readable confidence meanings. The legacy combined answer is printable. Physical paper/printer trials and human assistive-technology trials are not performed in this environment.

## Before/after evidence

The [evidence manifest](evidence/manifest.json) identifies unaltered browser screenshots and their hashes. Baseline captures use merged main; proposed captures reproduce the named Personal Efficacy and Personal Initiative defects. Synthetic text is clearly labelled. No owner screenshot files were attached in this session, so these are source-based reproductions, not a comparison against unavailable image files. Private teacher screenshots and PDFs are deliberately excluded from public evidence.

## Resolved verification failures and limits

- Chromium system-dependency installation required an unavailable root password. The existing system Chromium and downloaded browser were used successfully.
- An initial standard preview lacked the release-only private-content secret and correctly returned 503. Verification uses an **unaliased release-environment deployment within `applied-commerce-sa-staging`**, with `autoAssignCustomDomains:false`. Vercel names this target `production` within that isolated staging project; the production `applied-commerce` project was not deployed or changed. The canonical staging alias remains on `dpl_HrdBWbtRZtpCkqfGDBRUXjfoXqoY`.
- Early role journeys edited before cloud-baseline readiness and exposed expected revision conflicts; the harness now waits for baseline restoration and never clears saved work.
- A stopped Playwright-owned server caused a census timeout; the repeat uses a separately managed stable local server.
- A final local run inherited the staging URL despite local backend mode. The target guard stopped all six projects before interaction. It was rebuilt with explicit empty cloud configuration, and the local-only suite repeated successfully.
- An unavailable `rsync` left the isolated staging copy at the prior source revision. The new labelled-question journey failed as expected. The source was recopied, critical file hashes compared and staging rebuilt before repetition.

- The focused accessibility run caught an actual explicit-light desktop navigation contrast failure after 24 passing mobile scans. A scoped colour correction passes all 36 repeated scans. An extra local rerun of the existing 252 suite was stopped for that rebuild; the complete CI run is the authoritative final result.
- The first standalone axe harness used `browser.newPage`, which prevents axe from opening its analysis page. Switching to an explicit browser context corrected the harness; no violations were suppressed.

## Unresolved owner decisions / NOT TESTED

1. Review the [15 conceptual-question ambiguities](source-ambiguities.json). Their source prose is preserved, with no invented compulsory response.
2. Resolve [three authored privacy promises](editorial-ambiguities.json) in G8 L6, L8 and L72. “No one will read this but you” conflicts with existing authorised educator evidence review. Changing copy or access semantics requires an explicit educational/privacy decision; neither was silently altered.
3. Independently moderate all 395 proposed wraps against classroom intentions, especially later/independent work and multi-period conclusions. Source review and structural completeness do not constitute owner acceptance.
4. Human screen-reader sessions, physical printing, live classroom timing and a real multi-period teaching trial remain NOT TESTED. Browser labels/states, keyboard operation and PDF text checks are supporting evidence, not substitutes.

The PR remains separate for owner review. Production promotion requires owner approval after these decisions. Passing engineering tests alone does not certify the final acceptance standard.
