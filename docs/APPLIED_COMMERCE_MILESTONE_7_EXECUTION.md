# Applied Commerce — Milestone 7: Institutional Provisioning Activation

## Purpose

Milestone 7 activates the institutional provisioning layer that already exists in the live AC architecture.

The goal is not to introduce another institution, school, cohort or roster model. The existing Supabase model is now exposed through an operational management surface so a real institution can be provisioned into the same cohort/facilitator path already activated in Milestone 6.

## Repository + live-schema audit

Before implementation, the live production schema was checked rather than assuming the repository was the complete source of the current database contract.

The live database already contains:

- schools
- school_memberships
- cohorts
- cohort_staff
- cohort_enrolments
- RLS policies for school administration, cohort administration, cohort staff and enrolments
- public.create_school
- public.add_school_member_by_email
- public.add_cohort_staff_by_email
- public.enrol_learner_by_email
- corresponding private.*_impl authorization functions

The public RPC wrappers are SECURITY INVOKER; the privileged implementation functions are confined to the private schema, use SECURITY DEFINER with an empty search path, and perform explicit authorization checks.

No second institutional schema was created.

## Activation delivered

### Institution operations

Added:

- /institutions/manage
- components/institutional-admin.tsx
- lib/institutional/provisioning.ts

The surface supports:

1. creating the first school/institution through the existing create_school contract;
2. selecting an existing institution for accounts that already belong to one;
3. creating active cohorts with grade and academic year;
4. adding existing Applied Commerce accounts to the institution as administrators or educators;
5. assigning existing accounts to cohorts as lead/educator/assistant staff;
6. enrolling existing accounts as learners;
7. seeing the real selected-cohort learner/staff roster;
8. opening the existing facilitator workspace from the institutional operations surface.

The learner and staff actions use the existing email-based provisioning RPCs rather than exposing auth.users or introducing a client-side account directory.

## Security boundary

The operations UI does not bypass Supabase RLS.

School/cohort writes remain controlled by the existing policies and authorization helpers. The existing privileged implementation functions remain in the private schema. Public wrappers remain invoker functions.

This follows the current Supabase guidance to prefer invoker functions and to keep genuinely privileged definer logic narrowly scoped with an explicit search_path. citeturn8search0turn8search5

## Browser contract

Added browser coverage for:

- unauthenticated /institutions/manage access;
- safe sign-in gating;
- viewport integrity;
- the public /institutions entry point to institution operations.

The existing full presentation suite continues to certify the learner/facilitator surfaces.

## Live production state at implementation time

Verified directly against production Supabase:

- schools: 0
- cohorts: 0
- cohort staff: 0
- cohort enrolments: 0
- governed runtime release ac-runtime-3: 1
- unbound lesson progress rows: 0
- unbound prompt responses: 0

This means the institutional operations layer is ready for real provisioning, but no fabricated institution or cohort data was inserted to make the screen appear populated.

## Schema reconciliation boundary

The audit identified that several live institutional provisioning functions originate from the earlier live AC schema work and are not represented by the repository's original core migration files.

Milestone 7 therefore does not pretend that repository migration history is fully reconstructable. The generated Supabase TypeScript contract has been refreshed from the live schema so the application reflects the actual production API contract.

A separate migration-history reconciliation remains a governance task; it is not mixed into the application activation work.

## Verification

- live function contracts verified;
- public provisioning wrappers verified as invoker functions;
- private implementation functions verified as definer functions;
- institutional RLS policies verified;
- no institutional production records fabricated;
- release-bound learner state remains intact;
- generated database types synchronized with live Supabase;
- browser coverage added.

## Known Supabase advisor items

Security Advisor continues to report the independent Auth warning Leaked Password Protection Disabled.

Performance Advisor also reports unused indexes, plus existing multiple-permissive-policy and duplicate-index findings. These pre-date this activation and are not treated as reasons to remove indexes that support the operational access model. They should be handled in a dedicated database-hardening pass rather than mixed into institutional feature work.

## Deferred

- email invitation sending / new-account provisioning;
- bulk CSV learner import;
- institution-level programme management;
- advanced institutional analytics;
- sponsor reporting;
- canonical curriculum source fingerprinting;
- full reconstruction of the historical repository migration chain.