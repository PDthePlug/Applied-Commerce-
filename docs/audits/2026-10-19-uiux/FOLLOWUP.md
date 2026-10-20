# Applied Commerce UI/UX validation follow-up

This follows externally merged PR #40 (`66f56ca4`) on dedicated branch `codex/uiux-validation-followup-2026-10-20`. The merge contains the same files as the previously audited head. [Draft PR #41](https://github.com/PDthePlug/Applied-Commerce-/pull/41) contains the follow-up corrections. The initial report remains as `REPORT.md` in the repository and `ORIGINAL-REPORT.md` in the complete evidence bundle.

## Outcome

The register now contains **19 corrected defects: one P1, fifteen P2 and three P3**. Manual review of retained warnings found two additional defects: the alternative-activity disclosure had an 11px click target, and generic reader/account wrappers used unsupported accessible labels. Both failed dedicated browser regressions before correction. The disclosure now measures 44px; reader position is a named group and the redundant account wrapper label is removed. Three new browser scenarios also verify native assessment choices through their larger labels.

**Authenticated role end-to-end coverage remains NOT TESTED.** `AC_ROLE_FIXTURES` and isolated Supabase public configuration are absent. The existing role runners previously failed closed at fixture validation. This follow-up did not enable production testing, create accounts or bypass gates. Browser actions used the local backend with Supabase public URL/key unset. Source wording, response identities, persistence, schema and authorization behavior were retained. This agent did not merge or deploy the follow-up.

## Actual results

| Check | Result |
| --- | --- |
| Original PR remote CI | PASS: 204/204 acceptance cases, zero failures/skips/flaky; 160 Node tests and all engineering stages passed in run 39417307109 |
| Follow-up remote CI | **PASS: 213/213 acceptance cases**, zero failures/skips/flaky; all engineering stages passed. [Run 39423305203](https://github.com/PDthePlug/Applied-Commerce-/actions/runs/39423305203) |
| Follow-up local engineering | PASS: production build, lint, typecheck and 160 Node tests |
| New-defect reproduction | 2/2 failed before correction at mobile 360px; traces and measured values retained |
| Focused browser regressions | PASS: 9/9 at 1280/430/360px; zero failures/skips/flaky |
| Complete final-code discovery | **PASS: 384/384**, zero failed/skipped/flaky at 320/360/430/768/1280/1920px; no combined-run substitution |
| Final discovery evidence | 444 screenshots and 444 route diagnostics across 60 requested routes; 168 alternative-disclosure measurements meet 44px |
| Focused axe review | Four final-code scans: zero violations and no remaining `aria-prohibited-attr` incomplete findings on reader/account wrappers |
| Native touch and popup review | Sampled native radio circle is 13px, but its associated label is 336×60px and tapping selects it. The controlled term-map ID exists while inert/closed and becomes the active dialog when opened |
| Final print | A new A4 PDF was generated; extracted text verifies both full-answer/note ending markers and rendered output was inspected |

The complete acceptance suite executes the existing 48 axe scans. CI reports are downloadable from its Actions artifact with 14-day retention. The four focused local review reports are included in the complete bundle. The mobile reader retains an `aria-valid-attr-value` incomplete result concerning its initially inert popup. Direct DOM and interaction checks confirm a valid referenced ID and correct opening behavior; the finding is documented as reviewed rather than suppressed. These results do not establish WCAG certification or screen-reader usability.

The small-target heuristic measures native radio circles separately from their associated clickable labels. The manual touch sample and new label hit-area regressions distinguish this renderer from the confirmed disclosure defect. Raw warnings are retained. Physical devices, Safari/Firefox and NVDA/VoiceOver remain untested.

## Coverage, evidence and execution limits

The updated `coverage-matrix.csv` maps each requested route to all six widths and separately marks six authenticated actors NOT TESTED. It covers accessible learner/public institutional routes and staff gates, all 20 grade/term combinations sampled, six complex-control lessons and four exams. The full route matrix uses light appearance; dark and System-with-dark-device checks cover seven core learner/institutional surfaces at all six widths with extra-large/narrow reading. Compact landscape is checked at 800×360px. All 399 curriculum units have structural/runtime coverage; 26 sampled lessons and four exams do not establish individual visual certification of all 395 lessons.

The complete bundle's `evidence-index.html` provides a filterable index of the final screenshots. `route-diagnostics.json` retains names, landmarks, dimensions, target measurements, errors and narrowly identified speculative prefetch cancellations. `followup-changes.patch` captures this implementation; the earlier patch, failed attempts and traces remain included. Execution JSON preserves original statuses and timings; large embedded bodies are replaced by SHA-256/byte counts while final attachments are extracted as files. The repository contains a representative evidence subset and actual logs under `evidence/followup/`.

The first continuation sweep was intentionally interrupted after the new defects were reproduced: 112 passed, 2 interrupted, 270 not run. It was not reported as a completed pass. The final-code sweep restarted all 384 checks and passed. A temporary workspace execution-service disconnect occurred during this final run; browser processes continued, and the completed result was verified after reconnection. Earlier initial-pass failures and targeted retests remain in the historical report.

## Reproduce the local validation

Use Node >=22.13, the pinned lockfile and a local-mode production build with Supabase public configuration unset. Run `npm run verify:runtime`, `python3 scripts/test_block_identity.py`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npx playwright test --config=playwright.config.mjs` and `npx playwright test --config=playwright.audit.config.mjs`. The focused additions are `tests/browser/uiux-followup.spec.mjs`. Run acceptance and discovery sequentially when using their shared default port. Set `AC_BROWSER_EXECUTABLE=/usr/bin/chromium` for this cloud environment's installed browser. The audit executed here used an equivalent temporary configuration changing only port 3101 and evidence destinations. Reproduction scripts/configurations are retained in the bundle's `evidence/reproduction/`; restore them to `work/hardening/` before executing their repository-relative paths.

## Outstanding blockers

- **B01/B02 — authenticated roles and cloud workflows: NOT TESTED.** Private fixtures for an isolated Supabase project and a verified app/schema target are required. Learner/other-learner privacy, assigned/unassigned facilitator review, school/platform administration, cross-device saves, live rosters, reports, exports and staff print remain blocked.
- **B03 — account lifecycle: NOT TESTED.** Real email delivery, confirmation/reset, sign-in/out and password updates require isolated accounts and email fixtures.
- **B04 — physical devices and assistive technology: NOT TESTED.** Emulation, axe and keyboard/touch checks provide narrower evidence.
- **B05 — production release: NOT PERFORMED by this agent.** PR #40 was merged externally after the prior handoff. This follow-up makes no production Supabase writes, migrations or deployment actions and does not infer release authorization from that merge.
- **B06 — prescribed artifact directory: BLOCKED.** The cloud user cannot create `/codex/browser/projectless/0001-perform-a-comprehensive-evidence-driven-end-to-e/output` because `/codex` is not writable. The complete bundle is retained under `work/hardening/output/`; repository evidence and downloadable CI artifacts provide review access. No credentials, private fixtures or authenticated traces are exported.

## Exact validation metadata

```json
{
  "branch": "codex/uiux-validation-followup-2026-10-20",
  "baseCommit": "66f56ca4ea56c7b9fd6df4f95ef1203315cf1e6c",
  "testedCodeCommit": "0e01cc924c15ef9b49bcd760b954a71b1fd0f204",
  "completedUTC": "2026-10-20T12:48:24+00:00",
  "sourcePatchSHA256": "6a2d9222ce76fce3bb7b795378be1f399a370856df8c48b4f72acd9e0b9830fb",
  "discoveryChecks": 384,
  "screenshots": 444,
  "routeDiagnosticCaptures": 444,
  "requestedRoutes": 60,
  "smallTargetHeuristics": [
    {
      "label": "",
      "width": 13,
      "height": 13,
      "occurrences": 600
    }
  ],
  "alternativeTargetsMeasured": 168,
  "defects": 19,
  "authenticatedRoles": "NOT TESTED"
}
```
