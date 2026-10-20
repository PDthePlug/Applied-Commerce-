# Classroom milestone verification and release report

This is a draft review milestone, not production certification. Repository: `PDthePlug/Applied-Commerce-`; branch: `codex/classroom-benchmarks-2026-10-20`; [draft PR #42](https://github.com/PDthePlug/Applied-Commerce-/pull/42). Base `main`: `66f56ca4ea56c7b9fd6df4f95ef1203315cf1e6c`; implementation commit: `ee1aa09072ad89dc29a5ea19f492c8e4fbd3c153`; final scoped contrast correction: `3fff6cd37e674f03a5a4d89700125791f305c49d`. Full-matrix code/test revision: `e6c87e6a18913ef46f1eac84d34e8ab098276a04`. A final isolated staff-link touch-target correction is `898296e0609850031db1efcc0fd20456a333d9d6`, verified across all six affected viewports. Subsequent documentation/evidence commits do not change application behaviour. The ledger distinguishes automated evidence from human review and live-role checks that remain outstanding.

## Delivered scope

The source-linked inventory represents 395 unique lessons (80/75/80/80/80 by grade) and separately records four assessments. Canonical scratch compilation matched all 399 resolved runtime units. Source books, compiled curriculum files, response identities and assessment/portfolio models are unchanged. Raw runtime integrity reports 20,766 blocks; existing reader normalization produces 20,742 resolved blocks. Both representations are protected by hashes/tests.

Five fully developed private guide drafts contain seven 45-minute periods. The integrated classroom workspace provides grade/term/lesson selection, preparation, timed teacher/learner actions, discussion, practical scaffolds, formative understanding checks, differentiation, progression, presentation prompts, learner return context and browser printing. The other 390 guides are explicitly undeveloped. Complete source screening is not a claim of full independent moderation of 395 lessons.

The public repository versions encrypted private guidance and a non-sensitive source/validation manifest. The server requires fresh identity, active session and existing trusted staff/admin authority before decryption. Local mode denies the real API. No production Supabase writes, database migration, RLS changes, merge or deployment were performed.

## Severity-ranked implementation defect register

| ID / severity | Reproduction and observed evidence | Correction and regression |
| --- | --- | --- |
| CL-02 · P1 | Load a guide as the synthetic educator; sign out; sign back in as the same ID while holding a revoked-access response pending. One stale guide was visible, expected zero (`CL-02-before.json`). No guest view exposed it, but reauthorization could show old material. | Bind request results to the current authenticated user object as well as lesson/revision; abort changed-session requests. The six-width recovery test holds the new request pending, requires zero articles, then verifies the 403 state. PASS: all six viewport regressions; before/after probes in the evidence manifest. |
| CL-01 · P2 | At 320px, the practical scaffold container was 288px wide with 600px content, `tabIndex=-1`, no role or accessible label. Axe reported serious `scrollable-region-focusable`; the wrapper could not receive keyboard focus. | Add a named region and keyboard focus. Regression checks axe, focus and ArrowRight scrolling on every mobile benchmark. Before screenshot/trace retained privately. PASS: all six viewport regressions; before/after probes in the evidence manifest. |
| CL-03 · P2 | Existing account-sync error in dark appearance: foreground `rgb(34,34,34)` on `rgb(32,37,34)`. A focused axe check reported serious `color-contrast` for the alert and retry button. The synthetic fixture reliably creates this existing error state without live accounts. | Use the application's paper/ink/line theme variables and a 44px retry action. PASS: six-width contrast/keyboard regression; the after probe reports zero contrast violations. |
| CL-04 · P3 | The new guest classroom card’s Staff sign in link measured 83×17px at all six widths. Its intended 44px minimum height did not apply to an inline anchor. This is a product touch-target defect, not an asserted WCAG spacing-rule failure. | Display card links as inline-flex. Add a direct minimum-height assertion to real-app acceptance and discovery. PASS: six focused viewport cases, 19.4s; `evidence/signin-target-results.json`. |

Educational findings are separate in `EDUCATIONAL_IMPROVEMENT_REGISTER.md`: three confirmed objective omissions, specifically inspected benchmark issues and broad review queues. A keyword/sentence/workload screen is not labelled a confirmed software defect or proof of financial inaccuracy.

## Actual verification ledger

| Check | Actual result / limits |
| --- | --- |
| Current-main baseline runtime, Node, Python, typecheck, lint and build | PASS: 395 lessons, four assessments; 160 Node tests; two Python identity tests; local-only build. |
| Canonical source compilation comparison | PASS: 399/399 units identical after the same resolver; no extra or mismatched units. |
| Initial milestone Node tests | PASS: 172 tests. Two further regression cases were subsequently added; the final run passed all 174. |
| Private guide release | PASS: five guides, one per grade; seven periods; every period 45 minutes; schema, exact source excerpts, fingerprints and continuity links validated. Human approval NOT YET REVIEWED. |
| Embedded PostgreSQL restore/volume drill | PASS: seven checks, 500 synthetic learners, 10,000 answers, 26 restored table digests plus policies/grants/functions; no hosted connection. Timings were collected during contention and are not capacity evidence. |
| Public client asset check | PASS on the final application build: 77 assets checked against 25 private text/key sentinels; no matches. |
| Staged privacy check | PASS: initial 43 staged files contain no private key, plaintext guide package or private guide reasoning sentinels. |
| Final Node/typecheck/lint/runtime/Python/build | PASS: final CI 174 Node tests, typecheck, lint and build; local 174 plus 14 targeted classroom tests after inventory-screen refinement; runtime 395/4 and two Python identity tests. |
| Public/local browser acceptance (CI) | PASS: all 210 cases on the final application code revision, one worker, 3.6m. The duplicate local run was stopped after CI succeeded; it is not counted as completed acceptance. |
| Classroom synthetic UI matrix | PASS: 42 core cases (10.8m) plus six sync-warning regressions (3.2m), all six widths. |
| Six-viewport public/local discovery | PASS: 390/390 cases, 65 per viewport, 11.5m; 450 screenshots/diagnostic samples; zero unexpected page, console, HTTP or request errors. A subsequent scoped link-size fix passed all six affected viewport cases (19.4s). See `evidence/discovery-summary.json` and `signin-target-results.json`. |
| Screenshot and PDF inspection | PASS within stated scope: 52 private artifacts indexed; five A4 PDFs (7/7/9/7/10 pages by grade), no blank or out-of-page text; opening/practical pages visually inspected. |
| GitHub CI | PASS: [final application code run 39476206214](https://github.com/PDthePlug/Applied-Commerce-/actions/runs/39476206214), 174 Node tests and 210 browser acceptance cases (3.6m), identity/restore/typecheck/lint/build/census all successful. See `evidence/ci-898296e.json`; earlier run summaries are retained. |
| Live authenticated Supabase roles / institution boundaries | **NOT TESTED**: `AC_ROLE_FIXTURES` unset; user chose to skip fixture provision. Synthetic API/role contracts are not live-role validation. |

The first browser run reproduced CL-01 and was deliberately stopped after 14 failures, three passes, one interrupted case and 24 unrun cases. A later overlapping acceptance/classroom/database run suffered request resets and timeouts and was stopped; its partial logs are retained. Browser suites are now run sequentially. Another partial classroom pass was stopped after reproducing CL-02 so the corrected session binding could be retested. These partial runs are not counted as completed acceptance. The final local duplicate acceptance run was stopped after 48 cases had started without a new failure because the exact code revision had already passed all 210 cases in CI. The final completed acceptance total comes from that CI run.

QA-01 was a separate test-harness issue: full-page screenshots inherited a 10-second action timeout on two long Grade 9 reader pages. The initial discovery run recorded 56 passes, two capture failures, two interrupted cases and 330 unrun cases. DOM diagnostics for the first failure showed status 200, correct 320px width and no page/console/HTTP errors; nine aborted speculative prefetches were already classified separately. An explicit 30-second capture budget preserved every behavioural assertion. Both affected cases passed a focused retest (8.3s); the subsequent complete run passed all 390 cases. See `evidence/capture-budget-reproduction.json` and retained initial traces.

## Coverage matrix and evidence handling

| Surface / workflow | Role context | Widths | Status / evidence boundary |
| --- | --- | --- | --- |
| All source lesson identities, objectives, vocabulary, tasks, complexity/duration screens and source-order continuity | Source audit | All 395 | PASS inventory/linkage checks; educator moderation of the remaining 390 is not completed. |
| Five benchmark guides, practical table, discussion/checks/adaptations | Synthetic educator in isolated copy | 320/360/430/768/1280/1920 | PASS: core browser matrix; real guide payload, no Supabase identity/records. |
| Presentation focus/stage/period controls, private-reasoning separation, learner return navigation | Synthetic educator | All six | PASS: core matrix. |
| Selection across grades/terms, undeveloped-guide empty state, retry, revoked access, sign-out/same-account re-entry | Synthetic educator / contract responses | All six | PASS: core matrix; no claim of real session or RLS validation. |
| Guide print media / A4 PDF | Synthetic educator | All six print-media checks; five PDFs at 1280 | PASS: print-media checks and five inspected A4 PDFs. |
| Real teacher API denial, navigation-only learner context, stable local answer/note preservation | Guest / local learner | 360/430/1280 | PASS: completed CI acceptance; no private release supplied to guest. |
| Home, auth/reset, grade library/maps, reader samples in all 20 grade/terms, four assessments, progress, portfolio, settings and institutional routes | Public/local learner and safely gated shells | All six | PASS: full 390-case discovery and 450 diagnostic/screenshot samples. |
| Local answers, notes, completion, progress, portfolio/evidence, recovery and learner printing | Local learner | Existing three acceptance projects; discovery samples | PASS: completed CI acceptance. Hosted persistence NOT TESTED. |
| Facilitator evidence review/reporting, institution enrolment/assignments/admin, real role revocation | Real authenticated staff/admin | No private fixtures | **NOT TESTED**. Guest gates and synthetic contracts cannot validate these workflows. |

Raw evidence is retained under ignored `work/classroom/` and `test-results/`; teacher screenshots, PDFs and traces are private. Public summaries and failure metadata do not contain indicative answers or credentials. `evidence/evidence-manifest.json` records artifact hashes and exact source-file hashes. The encrypted review archive retains all five guide PDFs, the structured guides and selected screenshots/before-after captures; the complete raw matrix remains private in this workspace. See `evidence/README.md` for private review instructions. The public discovery manifest indexes all 450 screenshot hashes and route samples. The six committed signed-out classroom-gate images show the later corrected link target; their final hashes are in `signin-target-results.json`. Manual inspection covered the five new guides, their print opening/practical pages and representative public/gated screenshots. The other captures have automated diagnostics, not a claim of human review of every pixel. Screenshots are diagnostic evidence, not approved visual baselines. The geometry heuristic recorded 774 small-control instances in 198 diagnostic samples, including native checkbox glyphs and compact “If the main task is not possible” disclosure summaries. These counts are not a validated WCAG violation count; associated labels and target spacing require context. CL-04 was confirmed and corrected from that review. Broader target-spacing/assistive-technology review remains a validation limit. Automated axe and keyboard checks are not a WCAG certification or a human screen-reader trial.

## Unresolved release dependencies

1. Independent South African educator moderation and classroom pilots for all five draft guides; financial/legal/reference and multilingual review where relevant. Agent self-review is not that approval.
2. Secure retention/handoff and server-secret provisioning of the separate classroom content key. An unconfigured hosted preview cannot display private guides. Do not discard the private key with the ephemeral workspace.
3. Isolated live-role fixtures for assigned educator, learner, institution owner/admin and platform admin, plus revoked/unassigned cases. Real auth, hosted persistence and full role workflows remain NOT TESTED.
4. The remaining 390 guides need development and moderation after benchmark approval; the full-programme source screen is a foundation, not approval for bulk publication.
5. Formal assessment moderation/CAPS mapping and official current-reference verification are not certified. Source corrections need separate review; no underlying learner content was silently rewritten.

Draft PR #42 is for review only. No merge or production promotion is authorised by these test results.
