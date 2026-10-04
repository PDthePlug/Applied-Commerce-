# Applied Commerce backend activation

**Project:** Applied Commerce Production  
**Project ref:** `vxmcykmrqubwlysrqjyt`

The project is currently paused because the Supabase account already has the maximum number of active free projects. The application therefore remains in `local` backend mode.

## What is already prepared while paused

- evidence definitions, evidence records, reviews and report snapshot schema;
- rubric schema and v1 rubric definitions;
- facilitator cohort aggregation model;
- local facilitator review store;
- class-scale facilitator dashboard and reporting surfaces;
- frontend backend-mode contract;
- environment variable contract;
- migration file `20261004193000_evidence_assessment_engine.sql`.

## What cannot be truthfully completed while paused

A paused database cannot be queried or migrated. Therefore the following must wait until activation:

1. inspect the live core table columns and private authorization helpers;
2. apply the evidence migration;
3. generate fresh database TypeScript types;
4. add educator/cohort RLS policies against the **actual** existing helper functions and column names;
5. run learner, educator and school-admin authorization tests;
6. migrate browser-local learner responses into `prompt_responses` / evidence records;
7. enable Supabase mode in Vercel.

No migration in this repository should guess unknown live column names merely to appear complete.

## Activation sequence

When an active Supabase slot becomes available:

1. restore `vxmcykmrqubwlysrqjyt`;
2. list migrations and inspect `public` tables plus `private` helper functions;
3. compare the live schema with `supabase/README.md`;
4. apply `20261004193000_evidence_assessment_engine.sql`;
5. add the cohort-aware evidence authorization migration using the verified core schema;
6. run Supabase security/performance advisors;
7. generate TypeScript database types;
8. add the Supabase client dependency and shared persistence adapter;
9. configure Vercel:
   - `NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE=supabase`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
10. migrate the current learner browser record without changing stable prompt identities;
11. test learner → cohort → facilitator → evidence → report end to end;
12. only then expose authenticated facilitator navigation.

## Acceptance conditions

Activation is complete only when:

- a learner response saved on one device appears for an assigned facilitator on another device;
- an unassigned educator cannot read it;
- facilitator feedback and rubric scores persist;
- a revision returns to the learner without destroying the original evidence history;
- verified real-world evidence is distinguishable from ordinary reviewed responses;
- learner and cohort reports are generated from shared persisted records, not seeded demo data.
