# Applied Commerce database

The canonical South African project is **Applied Commerce Production Main**, `upvbxplswxhoqzbvgdxv`, PostgreSQL 17.11.0.003, eu-west-1 (read-only inspection on 2026-10-12).

The migration chain under `migrations/` reconstructs the application baseline and subsequent changes. `legacy-production-migrations/` and `staging-baselines/` are historical references, not an additional migration chain.

The backend has account-owned learning state and preferences, school/cohort roles, evidence/reviews, authored rubric tables, assessment attempts, and audit events. RLS is enabled on all inspected application tables. That alone does not establish secure field-level authorization or verified production readiness.

The audit migration `20261012082954_protect_assessment_decisions.sql` is **prepared and locally tested, not applied to production**. It blocks learner self-grading, protects record identity, seeds the existing authored rubric contract, saves facilitator review/evidence atomically, compares against the current learner answer, and stores answer snapshots and review history. See [ACTIVATION.md](ACTIVATION.md) for the migration-before-client release order and required remote verification.

`npm test` includes executable PostgreSQL/RLS tests in an isolated PGlite database with an Auth fixture. These do not substitute for Supabase Auth session tests against the live PostgreSQL 17 project.

Live inspection found no storage buckets, no cohorts or institution memberships, no evidence/review records, and no authored rubric rows. File uploads, assessment-attempt operations, notification delivery, and report snapshots have no complete application workflow. Current evidence is derived from saved answers; the product does not expose a separate submission stage.

The live preferences history has two applied entries with timestamps different from the single repository migration. Reconcile on an isolated clone before any production history repair. No production schema or user data was changed during this audit.
