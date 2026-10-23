# Protected synthetic fixtures

Run only against `inxshlumnhcgiahxqewe`. Configure SUPABASE_SECRET_KEY privately and set AC_ROLE_FIXTURES to an absolute directory outside the checkout. Never put these files or authenticated evidence in a GitHub artifact, public asset or PR attachment.

```sh
NODE_USE_ENV_PROXY=1 node scripts/prepare-role-fixtures.mjs
NODE_USE_ENV_PROXY=1 node scripts/validate-role-sessions.mjs
```

The first command uses supported Auth Admin creation and preserves credentials on repeat runs. It writes public-config.json, fixtures.json and a one-row bootstrap.sql to the private directory. Apply only that registry statement to staging via a scoped SQL administrator before running the session validator. It does not write Auth SQL. Domain fixture creation then uses the genuine platform/institution administrator sessions. The active educator and inactive educator retain ordinary educator school membership; the latter has a genuinely disabled cohort assignment after browser validation. The learner has an active enrolment and no educator role; the other learner is unrelated to the institution. The school owner exercises institution administration separately from platform administration.

Observed directory mode: **0700**; credentials/session/config files: **0600**. Actual path is outside the checkout. Browser evidence is under a protected child directory. No credentials, token claims, passwords, share URLs, cookies or private guide payloads appear in committed evidence. Synthetic responses are labelled and confined to the fixture accounts.

The API validator is repeatable with revision-aware writes. It temporarily revokes and restores the active educator to test existing-session enforcement. Browser validation likewise restores that educator in a finally block. The inactive account is assigned then disabled to establish genuine revocation, rather than claiming an always-unassigned account was revoked. Runs keep evidence for owner review; no broad delete/reset script is provided. Any later cleanup must target the recorded synthetic IDs and retain required audit evidence.

Read-only/supported administration does not require exporting the classroom decryption key. The original 24 plans were inspected through the authorised staging API; working inspection files remain private. Temporary Vercel access links are not portable test credentials and must be refreshed after they expire.

Useful runners:

- `scripts/inspect-staging-classroom.mjs`: six real browser password logins and authorised original-plan inspection. Initial PR #44 evidence.
- `scripts/review-staging-lesson.mjs`: representative Lesson 1, six widths, real staging login, collapsed preparation, cue/depth, all 82 fields.
- `scripts/validate-staging-classroom.mjs`: final hosted plan/print/role/reload/fresh-login validation; requires explicit AC_ROLE_BASE_URL and optional AC_EXPECTED_COMMIT. Actual print dialog is suppressed only to capture the real print tree; authentication and API responses are not intercepted.

`NODE_USE_ENV_PROXY=1 node scripts/validate-staging-expiry.mjs` performs a fail-closed preflight and returns exit 2/PENDING until the original token has actually expired. It never refreshes or edits that token.

Natural JWT expiry is a distinct test from logout or role revocation. Do not fabricate a signed session or edit Auth tables to accelerate it. Retain a genuine original token privately, wait until its exp time and verify rejection without refresh. Until that test completes, report natural expiry as NOT TESTED even though expired-session local tests and real logout checks pass.
