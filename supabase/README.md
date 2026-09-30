# Applied Commerce Supabase Backend

**Project:** Applied Commerce Production  
**Project ref:** `vxmcykmrqubwlysrqjyt`  
**Status:** backend foundation active; frontend sign-in intentionally not enabled.

## Applied migrations

1. `applied_commerce_core_tables`
2. `applied_commerce_security_policies`

## Core data model

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

## Security model

All application tables in `public` have Row Level Security enabled.

The Data API is **deny-by-default for anonymous users**. No table privileges are granted to `anon`.

Authenticated access is explicitly granted per table and then constrained by RLS:

- learners can read/write their own learning records;
- educators assigned to a cohort can read learner records for that cohort;
- school owners/admins can read learner records for learners enrolled at their school;
- school/cohort provisioning remains server-side for this milestone;
- educator access is read-only for learner progress, responses, notes and portfolio evidence.

Private authorization helper functions live in the unexposed `private` schema.

## Authentication state

Supabase Auth is prepared at the backend level, including automatic creation of a `profiles` row when a future auth user is created.

**Do not add a sign-in page or authentication gate yet.** The current Applied Commerce learner experience remains local-first until the account migration milestone is explicitly enabled.

## Current frontend boundary

The production frontend still uses the existing local learner store. This is deliberate: schema, RLS and provisioning boundaries are being established before switching persistence.

The later account migration should map:

`lesson completion -> lesson_progress`  
`inline answers -> prompt_responses`  
`lesson notes -> lesson_notes`  
`portfolio markers -> portfolio_artifacts + portfolio_evidence`

without changing the learner-facing curriculum interaction model.
