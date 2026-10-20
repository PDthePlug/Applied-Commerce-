# Applied Commerce — engineering agent guide

## Mission
Harden the existing Applied Commerce Grade 8–12 platform end-to-end. Preserve its source-faithful curriculum, stable response identities, existing Supabase contracts, evidence, notes, progress, reporting and role boundaries. This is an engineering and UX quality pass, **not** a rebrand or a rewrite.

## Repository and deployment truth
- This repository (`PDthePlug/Applied-Commerce-`) is the primary South African Applied Commerce application.
- Its production Vercel project is `applied-commerce`. Its isolated application staging project is `applied-commerce-sa-staging`.
- The separate `Applied-Commerce-Za` repository and `applied-commerce-za` deployment are not substitutes for this codebase.
- Read `README.md`, `docs/APPLIED_COMMERCE_PLATFORM_ARCHITECTURE_BASELINE.md`, `docs/APPLIED_COMMERCE_SEMANTIC_LEARNING_V3.md`, `docs/CROSS_DEVICE_VALIDATION.md` and `docs/CODEX_E2E_UIUX_HARDENING.md` before broad edits.

## Safety and fixtures (mandatory)
- Use `NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE=local` for unattended browser tests. Do not use or alter production learner accounts, institution data or responses.
- Canonical South African production Supabase project ref `upvbxplswxhoqzbvgdxv` is **not** a test target.
- Never paste, log, commit or export service-role keys, passwords, user sessions, auth cookies or private fixture files.
- For real-role validation, use the existing `scripts/lib/validation-target.mjs` and `playwright.roles.config.mjs` with a dedicated isolated Supabase project, private audit users and explicit target verification. No role fixtures belong in the repository.
- Do not run destructive database operations, bypass RLS/auth gates, change deployment configuration, or deploy to production without explicit authorization.
- Use an isolated working branch and pull requests; retain evidence and do not conceal failures.

## Prepare and verify
- Use Node >=22.13 (Node 22 or 24), npm and Python 3.
- Run `bash scripts/codex-e2e-setup.sh` once per fresh environment. It installs pinned npm dependencies, Chromium and creates a local-mode production build.
- Baseline gates: `npm run verify:runtime`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- Existing browser acceptance: `npx playwright test --config=playwright.config.mjs`.
- Additional UI/UX discovery sweep: `npx playwright test --config=playwright.audit.config.mjs`. Its screenshots are diagnostic evidence, **not** approved visual baselines.
- Run relevant existing tests before and after each UI fix; add regression tests for each reproducible defect.

## UI/UX review contract
- Inspect every accessible route and role workspace: landing, auth/reset, grade library, grade/term map, reader, progress, portfolio/evidence, profile, settings, institution landing, onboarding, institution administration and facilitator review/reporting. Mark gated experiences `NOT TESTED` until authenticated fixture coverage is available.
- Review 320, 360, 430, 768, 1280 and 1920 CSS-pixel widths; light, dark and system appearances; touch and keyboard; portrait/landscape where useful.
- Check flows, clicks, menus, focus, skip links, landmarks, labels, heading hierarchy, contrast, overflow, tap targets, dialogs, keyboard escape, error/loading/empty/success states, recovery, validation, content clipping, density and print styles.
- Exercise data integrity: saved learner answers and stable prompt keys, lesson completion, progress calculations, offline/local recovery, Supabase sync, RLS role gates, reporting and exports. Do not infer behavior from screenshots alone.
- Include console/page errors, failed requests, reproducible steps and screenshots/traces for significant issues.
- Separate appearance-only improvements from data/schema/security modifications. Never 'fix' a UI problem by weakening authorization or clearing learner state.

## Definition of done
Provide a route × viewport × role matrix, severity-ranked defect register, before/after evidence, tests added/changed, tests actually run with outcomes, residual risks and specific `NOT TESTED` blockers. No 'production ready' claim without demonstrated end-to-end evidence and authorized production release review.
