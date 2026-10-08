# Applied Commerce — Milestone 7: Institutional Provisioning

## Purpose

Milestone 7 turns the institutional data model activated in Milestone 6 into an operational provisioning path.

It does **not** introduce a second facilitator system, reporting model or institutional data model. It populates the existing:

- schools;
- school memberships;
- cohorts;
- cohort staff;
- cohort enrolments.

The existing facilitator workspace can then consume real institutional assignments instead of depending on a future manual database setup.

## What was audited first

The live production schema already contained the complete institutional relationship model and RLS:

- schools
- school_memberships
- cohorts
- cohort_staff
- cohort_enrolments

Milestone 6 had already wired the facilitator workspace to those tables.

The missing capability was administration: there was no operational UI or safe provisioning path for creating a school, assigning staff, creating cohorts or enrolling learners.

The join tables also had no uniqueness constraints for school/member, cohort/staff or cohort/learner relationships. Those are now enforced.

## Operational surface

A new authenticated route, /institution-admin, provides the minimum real provisioning workflow:

1. create an institution;
2. establish the signed-in account as owner;
3. add existing Applied Commerce accounts to the school;
4. create Grade 8–12 cohorts for an academic year;
5. assign existing accounts as cohort staff;
6. enrol existing learner accounts;
7. inspect the resulting school, staff and learner relationships.

This is deliberately an operational console rather than a new institutional dashboard.

## Authorization

The database remains the authority.

- School owners/admins can manage school memberships and cohorts.
- School owners/admins can assign cohort staff.
- Cohort staff and school owners/admins can manage cohort enrolments.
- Existing learner/staff RLS remains the boundary for learner data.
- Bootstrap creation is authenticated only.
- Email-based account resolution is restricted to authorised school administrators.
- Provisioning actions write audit events.

The privileged Auth-schema lookups are kept in the private schema. Public RPC entry points are SECURITY INVOKER wrappers. This avoids exposing SECURITY DEFINER provisioning endpoints through the public API surface.

## Migration

Live production migration:

- 20261008182352 milestone_7_institution_provisioning

The migration adds:

- unique institutional relationship indexes;
- supporting access indexes;
- school/cohort/staff/enrolment write policies;
- cohort-admin authorization helper;
- authenticated provisioning RPC wrappers and private implementations;
- explicit authenticated grants.

## Security verification

Direct production checks passed for:

- unique school membership identity;
- unique cohort staff identity;
- unique cohort enrolment identity;
- cohort administration select/write policies;
- cohort staff write policy;
- enrolment write policy;
- invoker-safe public provisioning wrappers;
- private security-definer implementation isolation;
- anonymous execution denied.

Supabase Security Advisor now shows no Milestone 7 provisioning-function warning.

The remaining independent Auth warning is **Leaked Password Protection Disabled**. That is an Auth configuration item, not a provisioning data-access defect.

## Deliberate boundary

This milestone provisions **existing Applied Commerce accounts**.

It does not yet implement invitation-email delivery or bulk learner import. Supabase's Auth Admin invitation API requires a trusted server environment and secret key; that should be added as a separate controlled capability rather than exposing privileged Auth credentials to the browser.

## Verification gate

Repository CI remains the release gate:

- task identity tests;
- curriculum tests;
- Milestone 7 database contract tests;
- typecheck;
- lint;
- production build;
- browser presentation acceptance;
- presentation census.

The milestone should not be considered closed until the PR and post-merge main CI are green.


## UI/data boundary

The administration screen is a client-facing operational surface, but authorization is not delegated to the UI. Every institution-management mutation is enforced by Supabase function checks and RLS; the browser only determines which controls to present.
