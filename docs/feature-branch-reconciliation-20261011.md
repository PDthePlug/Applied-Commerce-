# Applied Commerce feature-branch reconciliation (2026-10-11)

## Purpose and guardrails

This inventory compares remote refs with `main` and checks the canonical Supabase project's observed migration ledger and schema. It is a recovery map, not approval to merge a branch or replay a migration. Ahead/behind counts are graph relationships, not counts of unique missing features. Branches with overlapping histories must be reconciled by file/behavior and migration effects.

Repository: `PDthePlug/Applied-Commerce-`
Observed main SHA at audit start: `4d05279d63f026bf6bae5006c369586e94fbd95a`
Canonical Supabase project: `upvbxplswxhoqzbvgdxv` (Applied Commerce Production Main; ACTIVE_HEALTHY)
Legacy project `vxmcykmrqubwlysrqjyt`: INACTIVE; do not target.

## Environment facts observed

- Canonical database migration ledger has 13 entries, from `20261009071512` through `20261009221252`.
- The ledger contains both `20261009215759 account_personalisation_preferences` and `20261009221252 account_personalisation_preferences`.
- Main's migration tree contains one source file for this feature: `supabase/migrations/20261009200000_account_personalisation_preferences.sql`. Therefore source history and applied ledger are not a simple one-to-one match. Do not delete, rename, mark reverted, or re-run either live ledger row until the deployed DDL, both original migration contents/commits, and migration execution history have been matched.
- The live schema contains learner/profile, lesson progress/notes, prompt responses, portfolio evidence/artifacts, evidence review/reporting, schools/memberships, cohorts/staff/enrolments, preferences and private authorization registries.
- Live RLS includes explicit deny-client policies for `private.pending_role_assignments`, `private.platform_admins`, and `public.audit_events`; own-account/own-learner policies; staff/role-scoped cohort and evidence policies. This is schema/policy inspection only, not proof of cross-tenant denial in authenticated sessions.
- Supabase branch listing returned no database branches.
- Production data writes remain gated until authenticated end-to-end acceptance is recorded.

## Branch-by-branch decisions

Status meanings:
- **RECOVER**: feature has plausible unique value; port only verified files/behavior to a fresh branch off current main, then test.
- **ALREADY INCORPORATED**: substantive behavior appears in current main/live schema under a different commit or migration; preserve branch as historical evidence, no merge.
- **SUPERSEDED**: a newer source migration or implementation replaces this branch's approach; recover any missing tests/docs, not its older implementation wholesale.
- **ARCHIVE CANDIDATE**: no commits ahead of main or no unique functionality identified. Do not delete automatically; retain until evidence/owner confirms.

| Branch | Main comparison | Feature / tests / migrations to reconcile | Decision |
|---|---:|---|---|
| `feat/pre-registration-role-assignments` | 89 ahead / 14 behind | Pending role assignment and signup claim migrations; platform-admin authorization; auth panel and role gate; facilitator workspace/data source; institution provisioning; portfolio synthesis; browser auth/role/semantic tests. Main already has later-dated role-assignment, cohort-RLS and runtime migrations, so compare effects and port UI/service/test gaps only. | **RECOVER selectively — security and operations priority** |
| `feature/ac-profile-settings-bis-parity` | 36 / 4 | Preferences API/provider, settings/profile/home dashboards, auth persistence and settings browser/API tests; branch migration `20261009200000_account_personalisation_preferences.sql`. Reconcile against live duplicate ledger entries before any migration changes. | **RECOVER selectively** |
| `fix/auth-sync-and-branded-entry` | 27 / 13 | Auth page/panel, auth context/persistence sync, branded entry CSS, profile backfill migration and UI quality tests. Validate against current auth behavior and live profile backfill before porting. | **RECOVER selectively** |
| `fix/cohort-enrolments-rls-recursion` | 2 / 14 | RLS recursion fix and role authorization evidence. Main has `20261009082130_fix_cohort_enrolments_rls_recursion`; live ledger confirms it applied. | **ALREADY INCORPORATED** (retain evidence) |
| `fix/dark-mode-lesson-and-card-contrast` | 5 / 1 | Contrast styles and settings preference browser tests. Related open PR #28 has a failed browser acceptance run; repair tests and behavior before merging. | **RECOVER after CI repair** |
| `fix/rbac-migration-reconciliation` | 5 / 14 | Platform superuser authorization migration, facilitator role gate, role-gates browser test and migration tests. Check against live private platform-admin registry and deny-client policies; migration source exists in legacy folder but not the active migration tree. | **RECOVER selectively — high security priority** |
| `fix/reconcile-canonical-supabase-ref` | 2 / 2 | `.env.example` and `lib/backend/config.ts` canonical project ref. Open PR #26 keeps remote writes disabled pending acceptance. | **RECOVER via PR #26 after source/env/CI review** |
| `hardening/ac-settings-theme-contrast` | 14 / 2 | Preference route/provider/theme styles and browser/API tests. Overlaps with #28 and profile settings branch; combine behavior in one focused change, do not merge overlapping branches independently. | **RECOVER selectively after #28 triage** |
| `hardening/lean-auth-workspace-profile` | 4 / 4 | Home/profile dashboard and auth persistence/profile cleanup tests. Diff against main and the larger auth branch; retain only unique verified behavior. | **RECOVER selectively** |
| `hardening/portfolio-disclosure` | 3 / 0 | Portfolio disclosure inventory and static regression tests. PR #30 CI passed, but tests do not establish authenticated persistence or tenant isolation. | **RECOVER via PR #30 after review; not a substitute for E2E** |
| `milestone-2-auth-persistence` | 0 / 76 | No unique commits ahead of main. | **ARCHIVE CANDIDATE** |
| `milestone-3-learner-record` | 19 / 72 | Learner record, response identity, persistence and browser/identity tests. Main has since changed these areas; inspect for unique regression coverage before porting. | **RECOVER tests selectively; implementation likely superseded** |
| `milestone-4-source-governance` | 6 / 71 | Runtime release manifest/verifier and provenance tests. Main already has release seed/reconciliation migrations and runtime release tests. | **ALREADY INCORPORATED / SUPERSEDED**; retain any missing provenance assertions |
| `milestone-5-outlier-hardening` | 0 / 64 | No unique commits ahead of main. | **ARCHIVE CANDIDATE** |
| `milestone-5-outlier-remediation` | 5 / 63 | Presentation component/CSS, census script and browser presentation tests. Compare current renderer and CI behavior before selectively recovering tests or fixes. | **RECOVER selectively** |
| `milestone-5-presentation-census` | 2 / 70 | Census script and milestone docs; overlaps remediation and current renderer work. | **SUPERSEDED unless census adds uncovered cases** |
| `milestone-6-hardening` | 5 / 61 | Older operational/security migration files and SQL tests. Main/live ledger has later baseline, ACL, role, and client-grant migrations. Never replay these older migrations as-is. | **SUPERSEDED for migrations; recover missing assertions only** |
| `milestone-6-operational-activation` | 25 / 62 | Facilitator workspace/data source, persistence, CI and operational SQL tests. Live database already has cohort/staff/evidence structures; compare operations and permissions, then port missing UI/tests. | **RECOVER selectively — facilitator operations priority** |
| `milestone-7-institution-provisioning` | 30 / 60 | Institution-admin route/component and SQL provisioning tests; older provisioning migration. Live DB already has school/membership/cohort tables and role policies. | **RECOVER UI/tests; migration likely superseded** |
| `milestone-7-institutional-provisioning` | 14 / 60 | Institution workspace/admin screens, provisioning service and activation tests. | **RECOVER selectively — institution admin priority** |
| `milestone-7-institutional-provisioning-current-main` | 8 / 58 | Alternate provisioning UI/service and browser/SQL acceptance tests. Overlaps prior provisioning branch. | **RECOVER only unique tests/fixes; otherwise SUPERSEDED** |
| `milestone-7-institutional-provisioning-final` | 0 / 47 | No unique commits ahead of main. | **ARCHIVE CANDIDATE** |
| `milestone-7-migration-provenance` | 3 / 59 | Historical provisioning migration and milestone docs. Live schema/baseline supersedes the older migration path; provenance docs may still clarify lineage. | **SUPERSEDED for DDL; recover provenance evidence if unique** |
| `milestone-8-institution-facilitator-flow` | 0 / 28 | No unique commits ahead of main. | **ARCHIVE CANDIDATE** |
| `milestone-8-institutional-reporting` | 2 / 58 | Institutional reporting component and data-access library. Not shown in the main comparison file list. | **RECOVER — reporting priority** |
| `reconcile/ac-staging-canonical-migrations` | 143 / 14 | Large bundle: schema baseline, ACL reconciliation, role assignment, RLS, facilitator/institution UI, evidence tests and migration provenance. Many of its migrations are represented in the active main migration tree/live ledger under later timestamps. | **RECOVER evidence and missing feature slices only; NEVER bulk merge** |
| `recovery/verified-production-baseline-20261009` | 9 / 14 | Staging baseline/reconciliation docs and SQL; overlaps the active main schema baseline and migration tree. | **ALREADY INCORPORATED / SUPERSEDED**; retain as audit evidence |
| `refine/portfolio-progressive-disclosure` | 13 / 1 | Portfolio disclosure UI and browser/UI quality tests. PR #29's changes appear in main; residual divergence is not a reason to merge branch wholesale. | **ALREADY INCORPORATED** |

## Migration/environment reconciliation plan

1. Freeze migration writes and preserve a read-only export of `supabase_migrations.schema_migrations`, relevant catalog definitions, policies, grants, function definitions and current source refs.
2. Explain both live `account_personalisation_preferences` ledger rows: identify exact SQL content applied under each version, compare catalog state and deployment/CI records, and establish whether the duplicate is a repeated idempotent apply, a manually recorded migration, or an unintended duplicate. Do not modify the ledger speculatively.
3. Compare every active main migration's version/name/content with the live ledger. For baseline and ACL migrations, compare resulting DDL/policies/grants rather than relying only on filenames.
4. Keep `supabase/legacy-production-migrations` as historical reference, not an active migration directory. Do not copy older timestamps into the active tree or mark them applied without provenance.
5. Verify the intended Supabase ref for each Vercel environment without exposing secrets. Keep remote writes off until the test environment and role-specific E2E are accepted.
6. Run SQL authorization tests against a disposable/staging environment first; no destructive or schema-changing SQL against production as part of this audit.

## Acceptance matrix — not yet passed

- Learner: authenticate; read curriculum; save and reload progress, notes and responses; verify owner-only writes; verify cannot read/change another learner's records.
- Facilitator: authenticate; see only assigned cohorts/learners; create/update review/evidence; verify unassigned learner and other-school access denied.
- Institution admin: provision school/cohort; add/remove membership and enrolment; verify own-school scope and cross-school denial.
- Platform admin: role assignment and privileged provisioning require the server-controlled registry; anon/authenticated clients cannot read or mutate the private registry or audit events.
- Reporting: generate and read report snapshots within assigned scope; verify cross-tenant reports are denied.
- Deployment: verify preview/staging env vars, deployment SHA and runtime release metadata separately from CI success.

No authenticated browser session or credentialed end-to-end execution was available as part of this inventory. Therefore the acceptance matrix remains open and this document must not be read as production sign-off.

## Recommended recovery order

1. Reconcile the canonical project ref and duplicate migration ledger; keep production writes gated.
2. Fix PR #28 contrast/browser failures and triage semantic-learning failures independently.
3. Recover RBAC/cohort authorization assertions and run them against staging.
4. Recover pending role assignment/auth flow and facilitator workspace as small, separately tested slices.
5. Recover institutional provisioning and reporting UI/services with cross-school denial tests.
6. Review PR #30 static disclosure regression tests; separately complete authenticated portfolio persistence/isolation acceptance.
7. Merge one focused PR at a time, rerun full CI after each merge, and verify deployment/runtime SHA and environment separately.
