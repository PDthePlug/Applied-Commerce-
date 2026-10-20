# Applied Commerce UI/UX hardening

Started 19 October 2026. Completed 2026-10-20T13:44:54+02:00 (Africa/Johannesburg).

Branch: `codex/uiux-hardening-2026-10-19`. Base: `abc75ef`. The source patch SHA-256 and exact result counts are retained in `metadata.json` and `test-results.json`.

## Outcome and release boundary

Seventeen reproduced issues were corrected: one P1, fourteen P2 and two P3. The largest issue was unreadable dark-mode learner content. Other changes make reading preferences affect actual text and width, establish coherent landmarks and names, repair modal and tab keyboard interaction, restore failed lesson loads and omitted list-response inputs with portfolio capture, improve touch navigation, and produce readable lesson print output with complete response text.

Local engineering gates pass. The combined browser acceptance and six-viewport discovery results resolve every executed local check after targeted corrections and retests; the failed full-run attempts are preserved below. **Authenticated role end-to-end validation is NOT TESTED and remains a release blocker.** The environment has no private `AC_ROLE_FIXTURES`, isolated Supabase public configuration or dedicated accounts. Both role runners fail closed before authentication. This is not production certification.

All unattended browsers used a local-mode production build. Supabase public configuration was unset for that build. Database drills used disposable embedded PostgreSQL and synthetic identities. No production Supabase writes, migrations or deployments were performed. Source books, compiled curriculum identities, learner persistence and authorization contracts were retained.

## Tests actually executed

| Check | Actual outcome |
| --- | --- |
| Environment setup | `npm ci` passed. Setup script's system-dependency step failed because root login was unavailable. Existing `/usr/bin/chromium` launched successfully; builds/tests continued with it. |
| Runtime integrity | PASS: 5 grades, 395 lessons, 4 assessments, 20,766 stable blocks |
| Python identity tests | PASS: 2 tests |
| `npm test` | Baseline 159/159; final 160/160; zero skipped |
| TypeScript, ESLint, production build | PASS; final lint has zero errors/warnings |
| Embedded operational drill | PASS: 7 checks, 500 synthetic learners, 10,000 answers, 26 restored tables; role visibility, checked saves, conflicts and revoked sessions validated |
| Existing acceptance first run | 147 passed; 6 artifact-cleanup errors caused by overlapping runner output directories. A separate 12-case recheck passed. This failed attempt is preserved. |
| New behavior reproduction | All 7 initial scenarios failed against the original build. Intermediate accessibility/reading failures were retained and corrected. |
| Earlier complete acceptance | 195/195 passed before the final list-field correction |
| Full acceptance on final field/reflow build | **198 passed; 3 failures (two screenshot deadlines and one loading-focus race)** of 201; zero skipped/flaky. Failure logs remain included. |
| Targeted acceptance recheck on final build | **11 passed** with one worker after the concurrent matrices; all 201 prior acceptance cases are resolved, plus 3 new delayed-loading skip checks pass (204 distinct checks). Projects use desktop 1280, mobile 430/360 plus focused viewport overrides. |
| Original discovery baseline | 84 passed, but screenshots exposed loading-shell and error-enforcement gaps |
| Full expanded discovery | **383 passed; 1 failed**; zero skipped/flaky; six widths. Original failures remain in the evidence. |
| Post-fix discovery retest | **198 passed**, zero failed/skipped/flaky on the corrected list-field/reflow build. Every failed full-sweep case was rerun successfully; the combined matrix resolves all 384 checks. |
| Axe accessibility | 48 recorded scans; zero violations in the tested scenarios. Incomplete checks are retained for inspection; this does not establish WCAG certification. |
| Native touch emulation | PASS: 360px mobile/touch context; 4 touch pointer events opened/closed term map and navigated through the learner menu |
| Print | Browser assertions passed; exported A4 PDF was visually inspected and text extraction confirmed both long-answer and lesson-note ending markers |
| Real-role HTTP and browser runners | BLOCKED at fixture validation: `Set AC_ROLE_FIXTURES to a private fixture directory` |

The expanded audit ran the suites from `playwright.audit.config.mjs` through a temporary configuration that changed only the local port to 3101 and evidence destinations. Acceptance ran at 3100. Separate servers/output directories prevented further interference. The first expanded attempt treated legitimate Next segment-prefetch cancellations as errors and was interrupted (2 passed, 8 failed, 374 skipped). Trace headers identified `next-router-prefetch: 1`. The corrected run records 2245 such cancellations separately; other aborted requests, HTTP failures, console errors and runtime exceptions still fail. A dedicated Node regression protects that distinction.

## Coverage and evidence

The route × viewport × role matrix is `coverage-matrix.csv`. The final run contains 60 distinct requested routes and 444 diagnostic captures, with 444 full-page screenshots. `evidence-index.html` is an offline, filterable screenshot index; click a thumbnail for full resolution. `route-diagnostics.json` contains layout, names, headings and error/request observations.

| Area | Demonstrated coverage |
| --- | --- |
| Learner navigation | Home, five-grade library, every grade map, menu destinations, profile and settings |
| Curriculum reader | All 20 grade/term combinations sampled at all six widths; six additional complex-control lessons; all four assessment units |
| Learning integrity | Stable answer keys, notes and answers after reload, offline save/reconnect, completion-before-navigation, progress excluding assessments/retired IDs, portfolio recovery, retained earlier work and storage failure |
| Settings | Appearance/accent/text/width persistence, actual reader text/measure change, multi-tab drafts and saved profile updates |
| Account | Local unavailable sign-in state, anonymous reset/expired-link guidance and account-security gate; real forms/sessions blocked |
| Institutions | Landing, deployment/digitisation offers, four-perspective illustrative demo, keyboard tabs and working learner action |
| Staff | Every valid facilitator section and institution-management section safely gated while signed out; legacy administrator redirect and invalid sections |
| Responsive/accessibility | Six widths; dark/system with dark device setting; extra-large/narrow reading; compact landscape; keyboard focus/traps/Escape/skip links; accessible names, heading/landmark checks, contrast scans and touch-target measurements |
| Print/reports | Local learner print PDF and existing synthetic facilitator report-style fixture; live authenticated report calculations, exports and print are blocked |

All 399 curriculum units receive structural/runtime coverage. The 26 browser-sampled lessons and 4 exams are not an individual visual certification of all 395 lessons. Automated screenshots and measurements cover the entire requested route matrix; visual review sampled contact sheets, complex readers and the reproduced defects. Browser emulation is Chromium 154 with Playwright 1.64; physical devices, Safari/Firefox and screen-reader software were not used.

## Severity-ranked defect register

Detailed reproduction, observed/expected behavior, fix, regression and evidence references are in `defect-register.csv` and `defect-register.json`.

| ID | Severity | Defect | Final local status |
| --- | --- | --- | --- |
| AC-UX-01 | P1 | Dark lessons, portfolio and progress contain unreadable copy | Fixed; regression passed |
| AC-UX-02 | P2 | Reading preferences do not affect the actual lesson | Fixed; regression passed |
| AC-UX-03 | P2 | Compact term map lacks keyboard modal behavior | Fixed; regression passed |
| AC-UX-04 | P2 | Learner menu leaves background exposed to assistive technology | Fixed; regression passed |
| AC-UX-05 | P2 | Nested main landmarks and no skip navigation | Fixed; regression passed |
| AC-UX-06 | P2 | Default copy and System-light accents have insufficient contrast | Fixed; regression passed |
| AC-UX-07 | P2 | Lesson notes and term position lack names; brand label omits visible wording | Fixed; regression passed |
| AC-UX-08 | P2 | Reader print includes fixed navigation | Fixed; regression passed |
| AC-UX-09 | P2 | Reader load failure offers no retry in place | Fixed; regression passed |
| AC-UX-10 | P2 | Institutional perspective tabs lack keyboard behavior | Fixed; regression passed |
| AC-UX-11 | P2 | Demo learner call to action does nothing | Fixed; regression passed |
| AC-UX-12 | P2 | Header and account navigation have undersized touch targets | Fixed; regression passed |
| AC-UX-13 | P2 | Discovery suite can pass loading shells and ignore browser errors | Fixed; regression passed |
| AC-UX-16 | P2 | Unbroken authored answer blanks overflow compact lists | Fixed; regression passed |
| AC-UX-17 | P2 | Authored list blanks bypass response controls and evidence capture | Fixed; regression passed |
| AC-UX-14 | P3 | Account unavailable state has no h1 and lesson outline skips heading levels | Fixed; regression passed |
| AC-UX-15 | P3 | Missing site icon generates a repeated 404 | Fixed; regression passed |

## Before/after review

- `evidence/before-after/before-term-map.png` → `after-term-map-confirmed.png`: modal interaction and unobscured term navigation.
- `theme-v1-portfolio.png` → `after-dark-portfolio-320.png`: actual dark-mode evidence readability.
- `before-dark-reading-crop.png` and the saved dark-reader screenshots: body text/response readability and applied reading preferences.
- `before-reader.pdf` → `after-reader.pdf`: fixed chrome removed and full saved responses/notes retained. The exported PDF uses 12mm margins.
- `evidence/traces/`: valid anonymous failure/reproduction traces, including the previously ineffective reader size preference. No authenticated traces or fixture credentials are included.

Screenshots are diagnostic evidence, not approved visual baselines. All saved example answers and identities are synthetic.

## Unresolved blockers and limits

| Blocker | Status and required evidence |
| --- | --- |
| B01 — real authenticated roles | **NOT TESTED**: learner, other learner, assigned/unassigned facilitator, school administrator and platform administrator. Supply a private fixture directory for a dedicated isolated Supabase project; permit that project's host through the environment policy; verify the exact app/schema target with the existing validation guard; run HTTP/role browser suites. Never enable production testing. |
| B02 — cloud saves and live staff workflows | **NOT TESTED** through real Auth/API: cross-device conflicts, session revocation, roster/evidence review, rubric approval, enrolment/assignment, institution administration and real reports/exports/print. Embedded database checks and CSS fixtures provide narrower evidence only. |
| B03 — email account lifecycle | **NOT TESTED**: confirmation/reset delivery, real sign-in/sign-out and password update. Public unavailable/gated states and callback logic are covered. |
| B04 — device/assistive coverage | **NOT TESTED** on physical touch devices, Safari/Firefox or NVDA/VoiceOver. Axe results require manual follow-up for incomplete checks and do not certify WCAG compliance. |
| B06 — artifact output directory | The designated `/codex/browser/projectless/0001-perform-a-comprehensive-evidence-driven-end-to-e/output` directory cannot be created by this environment (OS permission denied at `/codex`). Full bundle retained at `work/hardening/output/Applied-Commerce-UIUX-evidence.zip`; report, matrix, register and representative evidence also committed on the review branch. |
| B05 — production release | **NOT PERFORMED**: no deployment, production smoke, provider backup/restore, monitoring or load-capacity certification. Production promotion requires separate authorization and release evidence. |

## Reproduce the local checks

Use Node >=22.13 and the pinned lockfile. Build with `NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE=local` and Supabase public configuration unset. Run `npm run verify:runtime`, `python3 scripts/test_block_identity.py`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npx playwright test --config=playwright.config.mjs --workers=4`, and `npx playwright test --config=playwright.audit.config.mjs`. Run the two Playwright configurations sequentially when using their default port. `npm run verify:operations` is entirely embedded/synthetic. Use `AC_BROWSER_EXECUTABLE=/usr/bin/chromium` when using the environment's installed browser.

The final DOM correction keeps the reader skip target mounted while a delayed lesson bundle loads. Its new regression first failed with the missing target and then passed at all three acceptance widths; the existing landmark/skip and load-retry scenarios were also rerun. The final build was verified by those focused checks; a complete matrix was not repeated after this loading-container change. Screenshot capture deadlines were raised from 10 to 30 seconds for long pages on this constrained runner; interaction deadlines were unchanged.

Exported execution JSON preserves original case statuses and timing; embedded attachment bodies are replaced by SHA-256/byte counts to avoid duplicating images. Final diagnostic/image attachments are extracted under `evidence/`.

The implementation patch is `changes.patch`. Repository changes include 17 new acceptance scenarios, the expanded discovery matrix and a regression for speculative request classification. Raw executed logs, prior failures, accessibility reports, screenshot diagnostics and operational-drill output are included under `evidence/`.
