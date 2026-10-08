# Applied Commerce Supabase Milestone 2 Reconciliation

**Status:** live schema reconciled and Milestone 2 database foundation applied  
**Date:** 8 October 2026

## Finding

The live Applied Commerce Supabase database already contained the AC core domain. Repository evidence and live inspection confirmed that the correct path was to extend that schema rather than introduce a generic replacement.

Existing AC boundaries include:

- profiles
- learner_profiles
- schools
- school_memberships
- cohorts
- cohort_staff
- cohort_enrolments
- lesson_progress
- prompt_responses
- lesson_notes
- portfolio_artifacts
- portfolio_evidence

The live migration history confirmed:

- `20260930150116 applied_commerce_core_tables`
- `20260930150212 applied_commerce_security_policies`

The previously staged evidence/assessment migration was also compatible with the live core schema and has now been applied.

## Milestone 2 changes

The live database now additionally contains:

- evidence definitions and rubric templates;
- evidence records and reviews;
- report snapshots;
- curriculum releases;
- curriculum-release references on learner state and portfolio records;
- assessment attempts;
- audit events;
- cohort/school-scoped evidence review authorization;
- audit-event client isolation;
- supporting foreign-key and release indexes.

The resulting migration history is:

- `20261008114756 evidence_assessment_engine`
- `20261008114817 ac_curriculum_release_bridge`
- `20261008114853 ac_evidence_scope_and_audit_guard`
- `20261008114930 ac_rls_performance_hardening`

## Why the first proposed schema was rejected

A generic replacement schema was briefly staged during implementation. Live inspection showed that it did not match the actual AC backend.

It was removed from GitHub before becoming the source of truth and was never applied to production.

That correction is important: the production database, existing AC terminology and existing authorization model remain authoritative.

## Security result

The live schema was inspected directly.

Existing AC security-definer helpers were verified with an empty search path:

- `private.can_view_learner`
- `private.has_school_role`
- `private.is_cohort_staff_member`
- `private.handle_new_auth_user`

Milestone 2 adds `private.can_review_learner` for staff-only evidence review authorization.

Supabase security advisors currently return **no security lints**.

## Source-governance boundary

Canonical curriculum manuscripts are still not repository-governed. The database therefore does not contain a fabricated source hash or a false source-verified curriculum release.

`curriculum_releases` records release identity and runtime/compiler metadata, while `source_release_key` remains nullable until source governance is completed.

## Verification

The live database passed the foundation smoke assertions for:

- required AC domain tables;
- RLS on response/evidence/assessment/audit surfaces;
- stable response/release uniqueness;
- evidence scope;
- review scope;
- audit client isolation;
- review authorization helper.

Generated TypeScript database types are committed at:

`lib/supabase/database.types.ts`

## Next application gate

The database foundation is now ready for the next controlled slice:

1. add the Supabase client/auth boundary;
2. implement a persistence adapter behind the existing `learning-store` contract;
3. preserve stable prompt keys exactly;
4. reconcile browser-local state into durable records;
5. test save/retry/recovery behaviour;
6. certify learner isolation and facilitator visibility;
7. only then enable Supabase backend mode in Vercel.

No application persistence switch has been made yet.
