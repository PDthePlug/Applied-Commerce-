# Operational readiness milestone

This milestone adds repeatable evidence gathering. It does not certify production or provision paid infrastructure. Production remains `upvbxplswxhoqzbvgdxv`; Zimbabwe (`hkarxzjmttjetotduvyx`) is excluded from South African validation.

## Current infrastructure gap

Inspection on 12 October 2026 found no development branches, a Free Supabase organization (`AutobodyConnect`), production-backed South African previews, and a Vercel project named `applied-commerce-staging` using Zimbabwe. Do not use those previews for destructive tests, bulk fixtures, restoration or load generation. Create a separate South African database/branch and Vercel staging target after confirming the organization and provisioning cost. Preserve the existing Zimbabwe target.

The canonical alias serves PR #33 (`13d43f8`). PR #34 (`635b5dd`) contains identical runtime source plus migration/test alignment; Vercel's latest deployment of that revision failed before building with `git_info_fail`. A READY canonical release is not evidence that later deployment automation works.

## Disposable restore and volume drill

```sh
npm run verify:operations
AC_DRILL_LEARNERS=1000 npm run verify:operations
```

The script accepts no database connection string. It uses the existing embedded PostgreSQL dependency and the minimal synthetic Auth schema shared with database regression tests. It replays every migration, generates 500 learners and 10,000 answers by default, exercises learner/facilitator/administrator queries and revision saves, then backs up the physical embedded database and restores it into a separate instance. It compares all table content digests, grants, RLS policies and functions. It checks authorization, review visibility, session revocation and revision-conflict behavior after restoration.

`test-results/operational-database-drill.json` contains engine version, migration hashes, measured timings, backup digest/size and executed checks. CI runs this drill without credentials. Only synthetic data is used; database backup bytes are not retained or uploaded. The measured embedded engine is PostgreSQL 18.3; production is PostgreSQL 17.11. Hosted-version verification is still required. Timings include single-client transactions, use 20 measured samples after warm-up and report nearest-rank percentiles. They are a local regression baseline, **not hosted throughput, concurrent-user capacity, a Supabase backup restoration or an agreed performance SLA**.

## Hosted availability and identity

`GET /api/health` returns HTTP 200 only when the configured hosted Supabase Auth health endpoint and a zero-row curriculum query both demonstrate availability. Misconfiguration, timeout, local-only mode or dependency failure returns HTTP 503. Responses are uncached and contain only status, configured public project ref, Vercel commit and dependency booleans. The REST OpenAPI endpoint requires a secret key, so it is intentionally avoided. The curriculum probe accepts an empty successful result or the expected PostgreSQL `42501` permission denial, which proves a database round trip while retaining anonymous access restrictions. It does not read private data, validate role workflows or expose provider errors. Each dependency probe times out after five seconds and disallows redirects.

This endpoint must be deployed before the revised hosted test runners are used. A deployment protection page fails validation; keep Vercel protection and use the approved automation-bypass approach if necessary. Do not disable TLS verification for certification. Production defaults may remain local during development; local health then correctly returns 503 rather than claiming hosted availability.

Configure a monitor only after selecting the provider and alert destination. A reasonable initial proposal is one check every five minutes, alert after two failures, and a recovery notification. Confirm the recipient and provider cost before enabling delivery. Demonstrate an alert using a controlled staging failure, record delivery and recovery timestamps, and restore the staging configuration. An endpoint or workflow alone does not prove alert delivery.

## Dedicated hosted role validation

Both private files must identify the same explicit `projectRef`:

- `public-config.json`: `projectRef`, Supabase `url`, public `key`.
- `fixtures.json`: `projectRef`, unique `run` beginning `audit-`, and six dedicated users: `learner`, `other`, `facilitator`, `unassigned`, `schoolAdmin`, `platformAdmin`. Each has id/email/password; emails begin with the run identifier. Existing school/cohort IDs may be retained for reruns.

Production is rejected by default; Zimbabwe and service-role/secret keys are always rejected. `AC_ALLOW_PRODUCTION_ROLE_TESTS=1` enables only an explicitly authorized bounded production role check, never bulk seeding, load or restore work. It is absent from the staging workflow.

Set public Supabase variables **when building Next.js**, not only when running `next start`. The browser bundle embeds those values. The health identity preflight also checks the server configuration; keep both build and runtime settings aligned. Real browser writes/readback then verify the browser uses the same fixture backend.

```sh
AC_ROLE_FIXTURES=/private/dedicated-fixtures \
AC_ROLE_BASE_URL=https://approved-south-african-staging.example \
AC_EXPECTED_COMMIT=<exact-40-character-deployed-sha> npm run verify:roles

AC_ROLE_FIXTURES=/private/dedicated-fixtures \
AC_ROLE_BASE_URL=https://approved-south-african-staging.example \
AC_EXPECTED_COMMIT=<exact-40-character-deployed-sha> \
npx playwright test --config=playwright.roles.config.mjs
```

The HTTP suite checks actual password sessions, role provisioning, visibility, escalation, competing writes, review/revision/approval, immediate role/session revocation and invalid requests. Browser cases cover conflict recovery and authored evidence on desktop/mobile. These tests create and modify their named fixtures; they are not read-only monitoring. No real person's credentials or privileges should be changed.

The manual GitHub workflow `hosted-role-validation.yml` executes only from `main` and uses a `staging` environment. Configure required reviewers and restrict environment deployment branches to `main` before adding fixture credentials. Variables:

| Name | Value |
|---|---|
| `AC_STAGING_SUPABASE_URL` | Isolated project's HTTPS origin |
| `AC_STAGING_SUPABASE_PUBLISHABLE_KEY` | Public publishable key |
| `AC_STAGING_PROJECT_REF` | Isolated database ref |
| `AC_STAGING_BASE_URL` | Approved staging application origin |
| Secret `AC_ROLE_FIXTURES_JSON` | Dedicated fixture JSON, entered directly in GitHub |

Supply the exact deployed commit at workflow dispatch. Actions are pinned to reviewed version SHAs. Dependency installation occurs before fixture secrets are injected. Private fixture/session files stay in the runner temporary directory and are deleted at completion; traces/screenshots are disabled. Only sanitized HTTP check results are uploaded. Workflow installation is not proof that the hosted suite ran. Secret fixtures must not be uploaded as ordinary artifacts.

## Remaining hosted certification evidence

1. Reconcile full migration history before staging replay; two historical preferences entries differ from the source timestamp. Do not reapply existing production SQL merely to match a filename.
2. Complete the real-session suites on isolated hosting at the exact release, with browser/API/database agreement and complete administrator reporting assertions.
3. Confirm signup and recovery email receipt in an authorized test mailbox; follow the actual link, change the password, reject the old password and reused/expired links, verify redirect allowlists and avoid user enumeration. Auth token generation alone does not prove email delivery. Configure custom SMTP for production and resolve the leaked-password-protection advisor using supported settings/plan.
4. Restore a real supported Supabase backup into isolation and compare application, Auth, role, grant, revision and history integrity; record restore duration and recovery point. Supabase database backups do not include Storage object bytes. Inventory buckets first and cover them separately if present. Do not reset or restore over production.
5. Select the monitoring provider/recipient, demonstrate a delivered alert and recovery, and retain sanitized evidence.
6. Agree expected cohort sizes, simultaneous users, operation mix and latency/error budgets; seed synthetic fixtures on staging, measure real HTTP throughput/p95/error rate, and exercise interruption/retry and post-load integrity. Local embedded timings do not satisfy this gate.

Keep all release gates NOT VERIFIED until their specific hosted evidence exists. Record exact commits, environments, timestamps, counts and limitations in the engineering report.
