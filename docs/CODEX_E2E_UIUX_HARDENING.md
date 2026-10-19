# Applied Commerce — Codex E2E UI/UX hardening environment

## Scope
Primary repository: `PDthePlug/Applied-Commerce-` (Next.js 16 / React 19). Existing acceptance: `playwright.config.mjs`. Authenticated role tests: `playwright.roles.config.mjs` with separate private fixtures. New discovery sweep: `playwright.audit.config.mjs` for public/local-mode and safely gated pages across six viewport widths. This setup is not production certification.

## Configure Codex Cloud
1. On desktop or web: `Settings > Codex Cloud > Environments > Create environment`, or `Work in > Cloud > Select environment > Create environment`.
2. Name it **Applied Commerce — UI/UX E2E Hardening**, select only `PDthePlug/Applied-Commerce-` and use this branch (or `main` after merging the PR).
3. Use Node 22 (>=22.13) or 24, npm, Python 3. Install script: `bash scripts/codex-e2e-setup.sh`. This setup does not request root access: when `AC_BROWSER_EXECUTABLE` points to an existing executable Chromium it reuses that browser, otherwise it downloads user-scoped Playwright Chromium without `--with-deps`. If browser system libraries are missing in a different image, ask the environment administrator to provision them rather than using privileged installation.
4. Start skill: `Use local backend mode; check the npm install, Chromium and Next.js build. Playwright starts the local server at http://127.0.0.1:3100. Run the existing browser suite, then the UI audit sweep. Never target production Supabase. Record tests actually executed and untested workflows.`
5. Set `NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE=local`. Keep Supabase URL and publishable key **unset** in this environment. No production service-role keys, passwords, or learner credentials.
6. Internet: choose Package managers. If needed for Playwright Chromium downloads, add `cdn.playwright.dev`; only add further verified download hosts.
7. Test and review the setup, **Publish**, then start a cloud task using the published environment. Re-publish on changes.

Cloud environments currently do not support interactive computer/browser use. The automated headless Playwright CLI may be run through shell, with screenshots inspected as artifacts. Do not conflate that with unrestricted manual browser control.

## Commands
```sh
bash scripts/codex-e2e-setup.sh
npm run verify:runtime
npm test
npm run typecheck
npm run lint
npm run build
npx playwright test --config=playwright.config.mjs
npx playwright test --config=playwright.audit.config.mjs
npx playwright show-report test-results/ui-audit-report
```

Existing acceptance covers desktop 1280px and mobile 430px/360px. New audit captures route screenshots and JSON diagnostics at 320, 360, 430, 768, 1280 and 1920px. The audit includes route status, page/console errors, page overflow, headings, field labels and potential small tap targets. Label/touch findings are heuristics, **not** WCAG certification. It is not automatically a CI release gate; the separate `workflow_dispatch` workflow stores evidence.

## Full pass checklist
- Site-wide design consistency: page layout, navigation, cards, typography, spacing, color/theme, responsiveness, overflow, empty/loading/error/retry/success states.
- Learner: home, five-grade library, term maps, reader controls, lessons, authored tasks, completion, progress, saved answers, portfolio and evidence recovery.
- Account: sign in/sign up/reset, profile, reading/accessibility settings, theme persistence, session state and anonymous gates.
- Staff: facilitator workspace, assessment/review, reporting/printing, institution management, cohorts and administration using **isolated** authenticated role fixtures.
- Accessibility: accessible names, landmarks, labels, keyboard focus order, menus and dialogs, Escape, contrast, reduced motion, text zoom, tap targets, print layouts.
- Integrity: stable learner response IDs, local/Supabase sync, role permissions, preserved historical answers; do not clear or rewrite existing learner state.
- Devices: 320/360/430/768/1280/1920 CSS px, landscape where applicable, light/dark/system, keyboard/touch.

## Authenticated phase is not automatically enabled
Real-role validation requires an isolated staging Supabase project, dedicated fixture users, private `AC_ROLE_FIXTURES` and an explicitly validated app commit. Reuse `scripts/lib/validation-target.mjs`, which rejects the South African production project `upvbxplswxhoqzbvgdxv` by default. Never run write tests against production. Do not copy real credentials into repository, logs, screenshots or reports.

## Required handoff
Provide route × viewport × role coverage, P0–P3 defect list with reproduction and expected behavior, console/network symptoms, screenshots/traces, precise fixes, regression tests, test results, residual risks and clearly flagged **NOT TESTED** scenarios. No claim of a hardened release without verified baseline, browser acceptance and isolated authenticated tests plus authorization for production promotion.
