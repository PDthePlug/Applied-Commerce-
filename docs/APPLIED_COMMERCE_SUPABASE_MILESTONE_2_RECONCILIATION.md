# Applied Commerce Supabase Milestone 2 Reconciliation

**Status:** schema foundation reconciled; production application intentionally deferred
**Date:** 8 October 2026

## Finding

Milestone 2 started from an assumption that AC still needed its initial Supabase domain foundation. Repository evidence shows that this foundation already exists or was previously applied before the production project was paused.

Existing AC backend vocabulary includes:
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

A staged evidence/assessment migration also exists at supabase/migrations/20261004193000_evidence_assessment_engine.sql. It adds evidence definitions, rubrics, evidence records, reviews and report snapshots, but the activation documentation explicitly says it has not been applied while the project is paused.

## Architecture correction

The AC Supabase work will extend the existing domain model. It will not replace it with a generic learner/institution schema and will not copy BIS tables.

Conceptual Milestone 2 mapping:

| Platform concern | Existing AC boundary | Milestone 2 treatment |
| --- | --- | --- |
| Identity | profiles / learner_profiles / auth.users | Preserve and inspect live columns before adapter work |
| Institution boundary | schools / school_memberships | Preserve existing terminology and authorization model |
| Learning grouping | cohorts / cohort_staff / cohort_enrolments | Preserve cohort assignment semantics |
| Lesson state | lesson_progress | Reconcile with the local learning-store contract |
| Stable learner answers | prompt_responses | Preserve stable prompt identities; no positional migration |
| Notes | lesson_notes | Keep separate from correctness/evidence |
| Portfolio | portfolio_artifacts / portfolio_evidence | Extend existing provenance model |
| Evidence | evidence_* migration | Apply only after live-schema inspection |
| Curriculum release | not yet verified live | Add only after determining existing release/version fields |
| Audit/recovery | not yet verified live | Design after inspecting existing audit/history conventions |

## Current database gate

The production project ref is vxmcykmrqubwlysrqjyt and is inactive. A restore attempt was rejected because the organisation has reached its active free-project limit. Direct database inspection also timed out while the project was inactive.

Therefore no production DDL has been executed during this Milestone 2 slice.

## Required next database sequence

Once an AC Supabase environment can be queried:

1. Restore or create an AC development/branch environment without deleting the existing project.
2. Pull/list the live migration history.
3. Inspect all public tables and columns.
4. Inspect existing private authorization helpers and their dependencies.
5. Compare the live schema with the repository migrations and activation documentation.
6. Apply or repair migration history only when the actual schema is known.
7. Run security and performance advisors.
8. Add the smallest compatible migration needed for curriculum-release/version coupling and durable state.
9. Run pgTAP RLS tests for learner, cohort-staff and school-admin isolation.
10. Generate database types and then implement the application persistence adapter.

## Safety decision

The duplicate initial migration briefly staged during implementation was removed after repository evidence exposed the existing AC backend foundation. This prevents an unverified second schema from becoming the new source of truth.

That correction is itself part of the Milestone 2 engineering discipline: inspect the actual system before changing the schema.