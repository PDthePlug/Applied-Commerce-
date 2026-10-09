# AC schema baseline and migration reconciliation — 2026-10-09

## Scope and safety

- Source of truth for the reconstructed schema: live AC production catalog, project `vxmcykmrqubwlysrqjyt`.
- Target: isolated AC staging project, `upvbxplswxhoqzbvgdxv`.
- No production rows, auth users, passwords, tokens, or credentials were copied.
- The baseline file under `supabase/staging-baselines/` is a staging rebuild snapshot, not a migration to replay against production.
- The snapshot includes tables, columns/defaults, constraints, indexes, functions, triggers, RLS policies, and object grants.
- Staging hardening enables RLS on all 22 application tables and adds an explicit deny-all client policy to `private.platform_admins`. Production remains unchanged.

## Reconstructed baseline

Verified after applying the snapshot to staging:
- 22 tables: 21 in `public`, 1 in `private`.
- 21 functions in `public/private`.
- 15 non-internal triggers.
- 60 policies recovered from the production catalog; one additional staging-only deny policy protects `private.platform_admins`.
- All 22 tables have RLS enabled.
- Application tables were empty immediately after baseline application.
- A post-build fingerprint comparison checked 478 catalog objects across columns, constraints, indexes, functions, triggers, and existing policies: definitions matched production, with only the expected staging-only deny policy as an extra object.
- After revoking inherited Supabase default grants and restoring catalog-derived ACLs, table grant counts and routine EXECUTE grants match production. Staging security advisor findings are now clear.

## Migration comparison

| Production migration history | Repository source | Comparison against the final catalog |
| --- | --- | --- |
| `20260930150116 applied_commerce_core_tables` | Missing from current repository | The core school/cohort/learner tables and their constraints/indexes were reconstructed from production metadata. The original SQL could not be recovered, so this is a catalog reconstruction, not a claim of byte-for-byte recovery. |
| `20260930150212 applied_commerce_security_policies` | Missing from current repository | Current policies and grants were reconstructed from `pg_policies` and PostgreSQL ACL metadata. The original source remains unrecovered. |
| `20261008114756 evidence_assessment_engine` | Exact filename/version match | All six evidence/rubric tables and their supporting indexes exist. Earlier evidence/review/report policies are intentionally superseded by later scope-guard policies; the learner INSERT/UPDATE policies remain and overlap with assigned-staff policies. |
| `20261008114817 ac_curriculum_release_bridge` | Exact filename/version match | Curriculum releases, assessment attempts, audit events, release foreign keys/indexes, and current policies exist. Operational seed rows were not copied to staging. |
| `20261008114853 ac_evidence_scope_and_audit_guard` | Exact filename/version match | `private.can_review_learner` and the current evidence/review/report/audit policies are present. |
| `20261008114927 ac_rls_performance_hardening` | `20261008114930_ac_rls_performance_hardening.sql` | Version mismatch: production records `14927`, repository filename uses `14930`. The learner-profile insert policy and hardening indexes are present. Evidence learner INSERT/UPDATE policies still coexist with staff policies and require an intentional policy-combination review. |
| `20261008120654 20261008165000_ac_learning_store_client_grants` | `20261008120654_ac_learning_store_client_grants.sql` | The version matches the repository filename, but the production migration **name** contains the extra `20261008165000_` prefix. The learner-profile client grant is represented in the current object grants. |
| `20261008174811 milestone_6_operational_activation` | Exact filename/version match | The facilitator evidence upsert function and runtime/evidence schema are present. Its data-seeding statements were not replayed because this baseline is intentionally data-free. |
| `20261008174922 milestone_6_security_and_migration_reconciliation` | Exact filename/version match | The final assigned-staff evidence policies and facilitator evidence upsert function exist. Index and policy history must be read as a sequence, not as independent idempotent scripts. |
| `20261008182352 milestone_7_institution_provisioning` | Exact filename/version match | Institution/cohort management functions, policies, and supporting indexes exist in the catalog. |
| Not recorded in production migration history | `20261008213500_platform_superuser_authorization.sql` exists in repository | The live catalog contains `private.platform_admins` and platform-admin authorization functions, but the migration is absent from history. Treat this as migration-history drift; do not replay it blindly because it contains role-seeding and learner-role cleanup DML. |

## Explicit drift and security observations

1. Production has RLS disabled on `private.platform_admins`; staging enables RLS and uses an explicit deny-all policy for `anon` and `authenticated`. No client policy grants access to the registry.
2. The live `private.create_school_impl` definition differs textually from the repository source (including audit metadata and the unique-violation message). Both check platform-admin authorization, but the drift must be resolved explicitly before production migration reconciliation.
3. The live `private.add_school_member_by_email_impl` removes the `learner_profiles` role row as part of an explicit learner-to-staff conversion and records `converted_from_learner`; the repository migration contains the same conversion intent. This is not treated as loss of learning history, and it must be tested as a role conversion. It is distinct from bootstrap-time cleanup DML, which must not be replayed blindly.
4. `public.evidence_records` has overlapping permissive INSERT and UPDATE policies for learner-owned and assigned-staff access. PostgreSQL combines permissive policies with OR semantics; policy overlap must be tested against intended cross-role access.
5. Duplicate unique indexes exist on the same key columns in `cohort_enrolments`, `cohort_staff`, and `school_memberships`. They were retained in the baseline to reproduce the catalog rather than silently alter production semantics.
6. The platform-admin `granted_by` foreign key lacks a covering index. Unused-index advisor findings on empty staging are not sufficient evidence to drop indexes.

## Identity and acceptance-test status

- Database negative checks on staging passed: an `authenticated` role without the platform-admin registry grant was denied direct SELECT on `private.platform_admins`, and an unassigned JWT subject calling `public.create_school` was rejected with `Only platform administrators can create institutions`. Neither operation created data.
- No production identity or credential was copied.
- The available connected Supabase actions do not expose an Auth Admin create-user/invite operation, and no signed-in browser session is available through the current tool surface.
- Direct SQL insertion into `auth.users` was not used because it bypasses Supabase Auth's supported account-creation path.
- Therefore authenticated identities for platform admin, institution admin, facilitator, and learner, plus real browser direct-URL tests, remain a gate. The existing CI signed-out route checks are not proof of authenticated authorization.
- Next: provision four synthetic accounts through Supabase Auth Admin in staging, add only staging role fixtures, then test cross-school/cohort reads and attempted unauthorized writes through authenticated sessions and RLS. Do not promote the staging-only hardening or snapshot to production without review.
