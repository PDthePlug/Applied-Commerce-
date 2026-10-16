# Reporting and institution workspace hardening

Continuation of the master audit, 13 October 2026. Overall verdict: **NOT PRODUCTION READY**. This increment does not certify unseen workflows or authorize new assessment criteria.

## Actual implementation and scope

The application is Next.js 16 / React 19 with Supabase Auth, owner-scoped learning RPCs, text evidence, facilitator decisions, derived portfolios, and institution provisioning. The catalogue has 395 lessons and four Grade 9 assessment content units. Formal assessment-attempt recording, file evidence uploads, and a separate draft/submitted lifecycle are not runtime features merely because their tables exist. The portfolio explicitly captures authored answers automatically. Existing product intent is preserved.

| Verified issue | Severity | Root cause | Correction and regression |
|---|---|---|---|
| Assessment completion inflated the lesson progress map | P1 | All completion IDs were counted against a lessons-only denominator | Generated current lesson IDs in the small catalogue; progress excludes assessment/historical IDs while preserving records; 395-lesson and 100% regressions plus actual exam/lesson browser completion |
| Selecting another learner did not survive opening review/report or refreshing the roster | P1 | Learner selection lived only in component state; navigation performed a full page load | Carry selection in encoded URLs and initialize server task pages from search parameters; resolve IDs only against the backend-authorized roster; preserve roster selection on refresh. Pure navigation/security tests and real multi-learner browser regression |
| Pending reviews inflated review coverage and rubric averages | P1 | Presence of a saved review was treated as a completed decision | Shared current-answer and completed-decision predicates in facilitator summaries, queues, report builders, admin metrics; executable pending/mixed-status/stale-answer tests |
| Local portfolio could show old-answer approval after editing | P1 | Guest review data bypassed the current-answer filter | Same response-bound filter for local and remote decisions |
| Prior cohort people/metrics appeared under a new selection | P1 | Async data was not bound to its selected cohort | Account/cohort/refresh-bound snapshots, loading/error states, retry; live role browser delay/failure test |
| Institution counts and names silently truncated at API caps | P2 | Unpaginated membership, school, cohort, enrolment, staff and profile reads | Stable paginated reads; profile UUID filters in batches of 100; 1,201-person / 1,001-school mocked API-cap regression. Hosted capacity remains unverified |
| Backend errors returned generic guidance | P2 | PostgREST object errors were not Error instances | Safe structured message classification; reload guidance for stale answers and prerequisite guidance for assignments. Raw database errors are not echoed |
| Portfolio content race/rejection | P2 | Uncancelled async content loads without a catch | Cancel superseded loads, commit metadata/content together, show recoverable failure |
| Nonproduction frontend configuration pointed to production Main | P1 | Preview/development URL and public key shared live Main | Vercel preview/development scope moved to isolated SA staging; production values verified unchanged. Existing builds need rebuilding |

## Unresolved reviewer reassignment rule

An authorized replacement facilitator cannot review evidence originally reviewed by another facilitator, even when the original facilitator loses the cohort assignment. An executable database test grants both required memberships through administrator RPCs and reproduces the ownership rejection. The history trigger's reviewer ownership rule is unchanged.

A product decision is required: explicit administrator transfer preserving review history, replacement takeover after original access is revoked, or permanent original-reviewer ownership. No arbitrary precedence or transfer rule was introduced.

## Repeatable role validation

Default `scripts/prepare-role-fixtures.mjs` still requires an empty isolated project. An explicit `AC_APPEND_AUDIT_FIXTURES=1` mode supports continuation on **only** `inxshlumnhcgiahxqewe` and rejects existing users unless every email matches dedicated `audit-stage-...@example.invalid` identities. It adds new accounts without resetting old credentials or records. It also generates five reporting learners in a separately validated manifest array. Confirmation is a test bootstrap, not proof of email delivery.

The reporting browser test uses real password sessions and normal learner/reviewer/admin APIs. It checks five authored answers, pending 0%, needs-revision 20%, learner edit invalidating the old decision to 0%, stale HTTP 400/P0001, acceptance 20%, delayed old cohort requests, privacy suppression for an empty cohort, failed loading without false zero/stale names, and retry. It runs at desktop and mobile sizes. Fixture credentials, SQL, and sessions stay outside the repository; failure traces and screenshots are disabled for role tests.

Run with a stage-compiled frontend and private fixture manifest:

```sh
AC_ROLE_FIXTURES=/absolute/private-fixtures node scripts/validate-role-sessions.mjs
AC_ROLE_FIXTURES=/absolute/private-fixtures npx playwright test --config=playwright.roles.config.mjs
```

Never target Main or Zimbabwe for synthetic fixture writes. Rotate Zimbabwe and isolated staging under the authorized Free-plan arrangement; keep Main active. The external engineering report records exact completed test counts, candidate SHA, deployment state and remaining gates.

## Dependency security observation

A fresh npm audit reports five high-severity dependency findings along the development-only eslint-config-next → fast-glob → micromatch → braces chain. `npm audit --omit=dev` reports zero findings. The reviewed advisory [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) lists no patched braces version as of this check. npm proposes an incompatible Next lint downgrade; no blind `audit fix --force`, fabricated clean audit, or removal of lint checks was performed. Restrict CI to trusted repository content and revisit the upstream fix. This is a tooling risk, not demonstrated exposure of an application request handler.

## Remaining risk-ranked work

- P1: resolve reviewer reassignment policy; test the chosen transfer/revocation workflow with real sessions and retained audit history.
- P1: actual signup verification and password-reset email delivery require a real authorized mailbox/provider; synthetic confirmed fixtures do not prove delivery.
- P2: verify every numerical reporting/export path and operational alert/recovery procedure; hosted HTTP capacity and long-duration reliability remain unverified.
- P2: review five unindexed foreign keys, three duplicate index pairs and overlapping evidence write policies with measured plans and staged forward migrations. Do not drop low-traffic indexes merely because advisors call them unused.
- P2: reconcile historical duplicate preferences migration records against the schema without blindly replaying or deleting production history.
- P2: complete route/control inventory for the remaining auth, profile, progress, institution public/deployment/demo and staff/report paths; mark absent runtime functionality separately from existing working controls.
- Free-plan constraint: leaked-password protection remains unavailable at the current plan; do not enable paid services without a separate decision.

Do not infer global gate PASS from a passing build, small synthetic cohort, or advisor scan.

## 16 October validation correction

The expanded browser regression exposed a fixture mismatch: Auth profile creation reads `full_name`, while the generator supplied `display_name`. New fixtures now use the supported field. Existing dedicated reporting learners receive preferred names through the normal revision-checked account RPC; no existing credentials are reset. Explicit browser action/navigation timeouts make missing controls fail at the affected boundary. An unrelated old generic cohort error also persisted after retry; load failures are now shown only in the account/cohort-bound error state, so a successful retry clears that state. The expanded browser test asserts the stale alert is absent after recovery.

The first named multi-learner browser execution then exposed a second selection root cause: `buildLearnerSummary` assigned every remote learner the same local placeholder ID. Remote roster/detail summaries now carry each authorized learner UUID; the local placeholder remains only for the local workspace. A distinct-ID regression covers both remote learners and the local fallback.
