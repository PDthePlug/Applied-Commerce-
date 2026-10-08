# Applied Commerce Supabase Backend

**Project:** Applied Commerce Production  
**Project ref:** `vxmcykmrqubwlysrqjyt`  
**Current status:** **PAUSED** — the schema foundation was previously applied, but the project cannot be reactivated while the account has no free active-project slot.

## Previously applied backend foundation

1. `applied_commerce_core_tables`
2. `applied_commerce_security_policies`

The project was prepared with:

- `profiles` — identity row linked 1:1 to `auth.users`
- `learner_profiles` — learner grade and learner-facing profile data
- `schools` — school / delivery organisation boundary
- `school_memberships` — owner, admin and educator membership
- `cohorts` — grade/year learning cohorts
- `cohort_staff` — educator assignment to cohorts
- `cohort_enrolments` — learner enrolment in cohorts
- `lesson_progress` — durable lesson completion/opening state
- `prompt_responses` — durable answer data keyed to curriculum prompt IDs
- `lesson_notes` — learner lesson notes
- `portfolio_artifacts` — curriculum-directed portfolio records
- `portfolio_evidence` — provenance links from portfolio artifacts to prompt responses

The previously documented security model was deny-by-default for anonymous users, with learners restricted to their own records and educators/school administrators restricted through cohort or school membership.

## Evidence & Assessment Engine prepared while paused

The repository now contains:

- `migrations/20261004193000_evidence_assessment_engine.sql`
- evidence definitions and developmental-domain mapping
- rubric templates and criteria
- evidence records and facilitator reviews
- report snapshot schema
- deterministic answer-rule support
- class-scale facilitator dashboard
- backend-mode contract
- facilitator data-source interface
- activation checklist in `ACTIVATION.md`

**Prepared does not mean applied.** The evidence migration has not been run against the paused database.

## Runtime boundary

Production remains:

`NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE=local`

The learner and facilitator surfaces therefore read browser-local records only. The facilitator dashboard is deliberately not exposed in the learner menu.

When the project is active again, the shared persistence implementation should map:

`lesson completion -> lesson_progress`  
`inline answers -> prompt_responses -> evidence_records`  
`lesson notes -> lesson_notes`  
`portfolio markers -> portfolio_artifacts + portfolio_evidence`  
`facilitator judgement -> evidence_reviews`  
`report exports -> evidence_report_snapshots`

Stable prompt identities must not change during that migration.

See `ACTIVATION.md` for the activation sequence and acceptance gates.


## Milestone 2 reconciliation

The existing repository documentation establishes that the AC core schema was previously prepared/applied before the Supabase project was paused, and that the evidence/assessment migration is staged but not applied. Therefore Milestone 2 must **extend and reconcile the existing AC schema**, not introduce a second initial domain model.

On 8 October 2026 the production project was checked through the Supabase management connection. The project is inactive, and the database query connection timed out. An attempted restore was rejected because the organisation has reached its active free-project limit. No production schema mutation was made.

A temporary duplicate foundation migration was therefore removed from the repository after the existing backend README revealed the prior core schema. This is intentional: an unverified second schema would violate the migration discipline being introduced.

The next database change, once the project is active or an AC development branch is available, must begin with a live schema pull/inspection and migration-history reconciliation. Only then should the stable curriculum-release bridge, durable learner-state adapter schema, and RLS certification be added.

The source-governance decision is documented separately in docs/APPLIED_COMMERCE_SOURCE_GOVERNANCE_DECISION.md. Source fingerprinting remains blocked until the authoritative manuscripts are repository-governed.
