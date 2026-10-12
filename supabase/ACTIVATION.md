# Applied Commerce environment and release activation

Verified 2026-10-12: South African production uses `upvbxplswxhoqzbvgdxv` (Applied Commerce Production Main). The former `vxmcykmrqubwlysrqjyt` project is inactive. Do not reactivate it to complete this audit.

Vercel `applied-commerce` has production, preview, and development credentials for the canonical production database. Those preview/development values do not provide test isolation. Vercel `applied-commerce-staging` is now configured for the Zimbabwe backend. Do not use it for South African database tests.

## Safe local checks

```sh
npm ci
npm run verify
npx playwright install --with-deps chromium
npx playwright test --workers=2
```

The test suite replays migrations in a disposable PGlite database with fixture Auth identities and PostgreSQL roles. It does not contact a remote database. PGlite uses PostgreSQL 18; the live project uses PostgreSQL 17. Live Auth sessions, email callbacks, provider configuration, storage, backups, and deployment access still require separate verification.

## Release sequence

1. Provision or identify an isolated South African Supabase test project and preview host.
2. Replay the repository migrations. Compare migration history and schema with the intended release; the production preferences migration history has different timestamps and duplicate entries. Do not repair migration history blindly.
3. Apply `20261012091449_protect_assessment_decisions.sql` to the isolated target. It preserves rows, seeds the existing authored rubrics, protects review decisions, and adds an atomic review RPC plus answer snapshots and audit history.
4. Regenerate database types against that target and compare with the migration-aware types in the repository.
5. Configure the isolated app with `NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE=supabase`, its URL, and its publishable key. Add `/auth/callback` and `/auth/callback?next=/auth/reset` URLs to its Auth redirect allowlist; verify email templates and delivery.
6. Use dedicated learner, second learner, assigned facilitator, unassigned facilitator, and administrator accounts. Test learner → cohort → facilitator → evidence → report, including revision, retries, revocation, two devices, offline recovery, and more than 1,000 responses.
7. Run security/performance advisors, verify backups and restoration, and review the engineering report's unresolved risks.
8. Obtain production deployment authorization. Apply the compatible migration before deploying the new client; the old client can continue using its existing RPC. Deploying the new client first will fail closed because the new review RPC and snapshot column are absent.
9. Run production smoke checks with explicitly approved safe accounts and inspect logs. Keep the migration when rolling back the app; reverting it would remove protection/history.

The product currently captures authored text responses automatically. No upload bucket or upload lifecycle exists. Do not invent submission or approval criteria without a product decision. Local-only browser answers are retained; guest answers are not silently transferred to unrelated accounts.
