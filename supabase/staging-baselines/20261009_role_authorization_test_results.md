# AC staging role authorization test results — 2026-10-09

## Scope and safety

- Target: AC staging Supabase project only.
- No production users, credentials, or application data were copied.
- No production database changes were made.
- The four Auth test accounts were already created in staging by the project owner. Role fixtures were added only to staging.
- All write probes that were allowed were executed inside transactions and rolled back; verification confirmed no probe school or unauthorized role/enrolment records remained.

## Isolated role fixtures

| Test role | Staging assignment |
|---|---|
| Platform admin | Active `private.platform_admins` entry |
| Institution admin | Active `school_memberships` admin membership |
| Facilitator | Active school educator membership and cohort lead assignment |
| Learner | `learner_profiles` entry and active cohort enrolment |

Fixtures use an institution and cohort named for RBAC testing. They contain no production data.

## Database authorization checks

| Check | Result |
|---|---|
| Platform-admin predicate for facilitator, institution admin, and learner | False |
| Platform-admin predicate for platform admin | True |
| Facilitator has school-admin authorization | False |
| Facilitator has active cohort-staff authorization | True |
| Institution admin has school-admin authorization | True |
| Learner has school-admin or cohort-staff authorization | False |
| Learner can view own learner record | True |
| Learner can view other learner-profile records | None visible |
| Facilitator and institution admin can view the assigned test learner | True |
| Learner direct update of test school | 0 rows affected |
| Facilitator direct update of test school | 0 rows affected |
| Institution admin direct update of test school | 1 row eligible; transaction rolled back |
| Platform admin direct update of test school | 1 row eligible; transaction rolled back |
| Institution admin invoking `public.create_school` | Rejected: platform-admin authorization required |
| Platform admin invoking `public.create_school` | Allowed in test transaction; transaction rolled back |
| Institution admin assigning platform admin as institution owner | Rejected by `private.enforce_exclusive_operating_roles()` |
| Institution admin assigning platform admin as cohort facilitator | Rejected by `private.enforce_exclusive_operating_roles()` |
| Learner attempting to enrol another user directly | Rejected by RLS; no row persisted |

## Issue found and staging fix

The original INSERT/UPDATE/DELETE policies on `public.cohort_enrolments` queried `public.cohorts` in their predicates. The cohort SELECT policy itself reads `public.cohort_enrolments`, which caused PostgreSQL to report:

`infinite recursion detected in policy for relation "cohort_enrolments"`

A staging-only migration replaced those predicates with `private.is_cohort_staff_member(cohort_id)`. This SECURITY DEFINER helper already checks active cohort staff, school owners/admins, and platform administrators, avoiding the recursive RLS path. After the fix, the unauthorized learner enrolment attempt was cleanly rejected by RLS rather than failing with a recursion error.

Proposed migration: `supabase/migrations/20261009100000_fix_cohort_enrolments_rls_recursion.sql`. Review in PR #19 before any production application.

## Remaining acceptance gate

Authenticated browser/direct-URL tests are **not yet complete**. The connected tooling available for this run does not provide a signed-in browser session, and the known Vercel project currently exposes only its production domain. Do not use the production app with staging-only accounts. Browser tests require a staging app deployment configured to the staging Supabase project, then direct-route checks for all four signed-in roles.

## Conclusion

Database role predicates and key authorization paths were exercised with simulated authenticated JWT subjects. Platform-admin exclusivity is enforced by database triggers, and the identified enrolment-policy recursion was corrected in staging and proposed for review. This is not yet a complete release sign-off because signed-in browser/direct-URL acceptance remains outstanding.
