# Classroom milestone verification and release report

This is a draft review milestone, not production certification. Repository: `PDthePlug/Applied-Commerce-`; branch: `codex/classroom-benchmarks-2026-10-20`; [draft PR #42](https://github.com/PDthePlug/Applied-Commerce-/pull/42). Base `main`: `66f56ca4ea56c7b9fd6df4f95ef1203315cf1e6c`; implementation commit: `ee1aa09072ad89dc29a5ea19f492c8e4fbd3c153`; final scoped contrast correction: `3fff6cd37e674f03a5a4d89700125791f305c49d`. Final evidence and follow-up verification are being completed; entries below distinguish completed checks from pending ones.

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
| Final Node/typecheck/lint/runtime/Python/build | PASS: 174 Node tests; typecheck, lint and local production build; runtime 395/4 and two Python identity tests. |
| Real local-mode browser acceptance | IN PROGRESS; 210 cases collected. |
| Classroom synthetic UI matrix | PASS: 42 core cases (10.8m) plus six sync-warning regressions (3.2m), all six widths. |
| Six-viewport public/local discovery | QUEUED after acceptance; includes the new classroom gate. |
| Screenshot and PDF inspection | PASS within stated scope: 52 private artifacts indexed; five A4 PDFs (7/7/9/7/10 pages by grade), no blank or out-of-page text; opening/practical pages visually inspected. |
| GitHub CI | [Run 39433583292](https://github.com/PDthePlug/Applied-Commerce-/actions/runs/39433583292), implementation commit: PASS: all steps, 174 Node tests and 210 browser acceptance cases (2.8m). See `evidence/ci-ee1aa09.json`. |
| Live authenticated Supabase roles / institution boundaries | **NOT TESTED**: `AC_ROLE_FIXTURES` unset; user chose to skip fixture provision. Synthetic API/role contracts are not live-role validation. |

The first browser run reproduced CL-01 and was deliberately stopped after 14 failures, three passes, one interrupted case and 24 unrun cases. A later overlapping acceptance/classroom/database run suffered request resets and timeouts and was stopped; its partial logs are retained. Browser suites are now run sequentially. Another partial classroom pass was stopped after reproducing CL-02 so the corrected session binding could be retested. These partial runs are not counted as completed acceptance.

## Coverage matrix and evidence handling

| Surface / workflow | Role context | Widths | Status / evidence boundary |
| --- | --- | --- | --- |
| All source lesson identities, objectives, vocabulary, tasks, complexity/duration screens and source-order continuity | Source audit | All 395 | PASS inventory/linkage checks; educator moderation of the remaining 390 is not completed. |
| Five benchmark guides, practical table, discussion/checks/adaptations | Synthetic educator in isolated copy | 320/360/430/768/1280/1920 | PASS: core browser matrix; real guide payload, no Supabase identity/records. |
| Presentation focus/stage/period controls, private-reasoning separation, learner return navigation | Synthetic educator | All six | PASS: core matrix. |
| Selection across grades/terms, undeveloped-guide empty state, retry, revoked access, sign-out/same-account re-entry | Synthetic educator / contract responses | All six | PASS: core matrix; no claim of real session or RLS validation. |
| Guide print media / A4 PDF | Synthetic educator | All six print-media checks; five PDFs at 1280 | PASS: print-media checks and five inspected A4 PDFs. |
| Real teacher API denial, navigation-only learner context, stable local answer/note preservation | Guest / local learner | 360/430/1280 | New acceptance tests in progress; no private release supplied to guest. |
| Home, auth/reset, grade library/maps, reader samples in all 20 grade/terms, four assessments, progress, portfolio, settings and institutional routes | Public/local learner and safely gated shells | All six | Existing discovery suite pending on final code. |
| Local answers, notes, completion, progress, portfolio/evidence, recovery and learner printing | Local learner | Existing three acceptance projects; discovery samples | Existing acceptance in progress. Hosted persistence NOT TESTED. |
| Facilitator evidence review/reporting, institution enrolment/assignments/admin, real role revocation | Real authenticated staff/admin | No private fixtures | **NOT TESTED**. Guest gates and synthetic contracts cannot validate these workflows. |

Raw evidence stays under ignored `work/classroom/`; teacher screenshots, PDFs and traces are private. Public summaries and failure metadata do not contain indicative answers or credentials. `evidence/evidence-manifest.json` records artifact hashes and exact source-file hashes. The encrypted review archive retains all five guide PDFs, the structured guides and selected screenshots/before-after captures; the complete raw matrix remains private in this workspace. See `evidence/README.md` for private review instructions. Screenshots are diagnostic evidence, not approved visual baselines. Automated axe and keyboard checks are not a WCAG certification or a human screen-reader trial.

## Unresolved release dependencies

1. Independent South African educator moderation and classroom pilots for all five draft guides; financial/legal/reference and multilingual review where relevant. Agent self-review is not that approval.
2. Secure retention/handoff and server-secret provisioning of the separate classroom content key. An unconfigured hosted preview cannot display private guides. Do not discard the private key with the ephemeral workspace.
3. Isolated live-role fixtures for assigned educator, learner, institution owner/admin and platform admin, plus revoked/unassigned cases. Real auth, hosted persistence and full role workflows remain NOT TESTED.
4. The remaining 390 guides need development and moderation after benchmark approval; the full-programme source screen is a foundation, not approval for bulk publication.
5. Formal assessment moderation/CAPS mapping and official current-reference verification are not certified. Source corrections need separate review; no underlying learner content was silently rewritten.

Draft PR #42 is for review only. No merge or production promotion is authorised by these test results.
