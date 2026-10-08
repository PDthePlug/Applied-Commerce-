# Applied Commerce Supabase foundation

This directory contains the repository-managed database foundation for Applied Commerce Milestone 2.

## Current status

The Applied Commerce Production Supabase project is now active and healthy after BIS Staging was paused to free an active-project slot.

Project ref: `vxmcykmrqubwlysrqjyt`  
Region: `eu-west-1`  
Postgres: 17.11.0.002

The live database was inspected before schema changes. It already contained the AC core schema and two repository-recorded migrations:

- `20260930150116 applied_commerce_core_tables`
- `20260930150212 applied_commerce_security_policies`

The Milestone 2 work therefore **extends the existing AC schema** rather than replacing it.

## Milestone 2 migrations applied

- `20261008114756 evidence_assessment_engine`
- `20261008114817 ac_curriculum_release_bridge`
- `20261008114853 ac_evidence_scope_and_audit_guard`
- `20261008114930 ac_rls_performance_hardening`

Repository migrations are kept under `supabase/migrations/`.

## What the foundation now provides

- Existing AC identity, school and cohort model preserved.
- Existing learner progress, prompt response, notes and portfolio model preserved.
- Evidence definitions, rubric templates, evidence records, reviews and report snapshots are active.
- Curriculum release metadata is now a first-class release boundary.
- Durable learner records can reference a specific curriculum release without positional identities.
- Assessment attempts have durable release/unit/attempt identity.
- Audit events exist with client access denied.
- Evidence review access is scoped through the verified AC cohort/school authorization model.
- RLS remains enabled across the learner/evidence domain.
- Generated TypeScript database types are committed at `lib/supabase/database.types.ts`.

## Source-governance boundary

Canonical curriculum manuscripts are still not repository-governed. Consequently:

- `curriculum_releases.source_release_key` is nullable.
- No fabricated source SHA-256 was inserted.
- No curriculum release has been falsely declared source-verified.
- Source fingerprinting remains a future release gate.

The runtime format is currently recorded as version 3 because that is the verified compiled-runtime contract; compiler/source identity remains explicit metadata rather than an invented provenance claim.

## Verification

The live database passed the Milestone 2 foundation smoke assertions for:

- required AC tables;
- RLS on the critical response/evidence/assessment/audit surfaces;
- stable response/release uniqueness;
- evidence and review authorization policies;
- audit client isolation;
- review authorization helper existence.

Supabase security advisors currently report **no security lints**.

Performance advisors report unused-index information on the currently empty/near-empty database; these are not treated as defects at this stage. The previous RLS initialization-plan warning and missing foreign-key index findings introduced by the Milestone 2 work were corrected.

## Important boundary

This milestone does **not** yet:

- switch the Next.js application from local learning state to Supabase persistence;
- migrate existing learner browser state;
- expose facilitator navigation;
- seed a curriculum release without governed source provenance;
- perform production learner-data migration.

Those are subsequent persistence/application rollout gates.
