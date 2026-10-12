# Revision-checked learning saves and role-session validation

Learning answers, lesson notes, completion state and learner profiles use server revisions. Each dirty field carries the revision last observed by that device. The account-scoped save transaction serializes competing inserts and applies only matching changes; equal-value retries acknowledge the existing revision. A rejected field remains on the device and is shown beside the authoritative account version. Explicit resolution rebases that field, retains both versions in local recovery history and retries with the new revision. Device timestamps never decide which educational content wins. Navigation does not invalidate completion revisions. Settings sends only the edited fields and applies those atomically, preserving other preferences; for the same presentation setting, the latest explicitly applied choice takes effect.

The browser keeps an account-specific baseline, pending edits and conflicts across reloads. It refreshes on focus, reconnect and a 30-second timer. New keystrokes during an in-flight request survive its acknowledgement. Failed saves remain local and show an error. Staff profiles remain device-specific under the existing exclusive-role rules. Existing timestamp-only records with differing remote content require explicit resolution; they are never silently selected by clock time.

Private-data policies AND the existing ownership/role rules with an active Auth session and active profile. Role helpers also check the session so security-definer provisioning functions reject logged-out sessions. A JWT must name a real session belonging to its user; ended, time-box-expired, deleted or banned accounts cannot use private data. Public curriculum remains readable without Auth. These checks do not retract copies already downloaded to a device.

## Controlled rollout

1. Replay all migrations in a disposable PostgreSQL environment and run `npm run verify`.
2. Apply `learning_revision_sync` and `active_role_sessions`. They add metadata/functions/policies while leaving old clients' table-write grants in place during rollout.
3. Build and test the revised frontend against dedicated accounts; publish and verify the exact source commit in production.
4. Apply `require_revision_checked_writes` after the frontend switches. It revokes unconditional client mutations and places elevated RPC implementations in the private schema behind invoker wrappers.
5. Re-run session authorization probes after the final migration. Old open clients must reload to use the revision protocol; their local edits remain intact.

Do not roll the frontend back to an unconditional-write release after step 4. Use a forward fix. Preserve migrations and local recovery data. Do not reset databases.

## Repeatable tests

`npm test` includes PostgreSQL migration/RLS/RPC tests and pure offline/reconciliation tests. Existing guest browser acceptance uses `npx playwright test`. Role tests are explicitly opt-in, use separate fixtures and never run against a guessed account:

```sh
AC_ROLE_FIXTURES=/private/dedicated-fixtures node scripts/validate-role-sessions.mjs
AC_ROLE_FIXTURES=/private/dedicated-fixtures npx playwright test --config=playwright.roles.config.mjs
```

The private directory contains `public-config.json` (`url`, public `key`) and `fixtures.json` (`run` beginning `audit-`; dedicated `users` named learner, other, facilitator, unassigned, schoolAdmin, platformAdmin, each with id/email/password). Provision confirmed Auth identities with the supported Auth admin API in an isolated environment where available; assign platformAdmin only to the dedicated fixture account. Never alter an existing person's credentials or roles. The HTTP runner provisions its test school/cohort through normal role APIs and writes IDs/session state privately. Browser tests require a production build configured for the same Supabase project; the local server receives the public configuration automatically. `AC_ROLE_BASE_URL` targets an explicitly approved hosted build. Browser traces/screenshots are disabled for credential privacy. A custom test browser behind an intercepting proxy can opt into `AC_TEST_PROXY_TLS_BYPASS=1` solely for test transport; certificate trust is then outside the evidence, and production TLS configuration is unchanged. No service-role key is needed by the runners.

The HTTP suite covers real password sessions for six accounts; provisioning, owner/assigned/unassigned/administrator visibility; privilege escalation denial; competing saves and idempotent retry; revision feedback, resubmission, stale-review rejection and approval; cohort role revocation; settings patches; invalid/anonymous actions; logout, revoked refresh tokens and JWT tampering. Browser tests cover offline conflicts and the authored evidence review workflow on desktop and mobile. Email confirmation/recovery delivery, a backup restore, monitoring alerts and load capacity require separate release evidence. Passing these suites alone is not production certification.
