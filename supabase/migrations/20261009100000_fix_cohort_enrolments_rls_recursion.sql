-- Avoid recursive RLS evaluation when authorizing cohort enrolment writes.
-- private.is_cohort_staff_member() is SECURITY DEFINER and already covers
-- assigned cohort staff, school owners/admins, and platform administrators.
-- This is equivalent to the prior predicates without querying public.cohorts
-- through its own RLS policy, which reads public.cohort_enrolments.

drop policy if exists "cohort staff delete enrolments" on public.cohort_enrolments;
create policy "cohort staff delete enrolments"
on public.cohort_enrolments
for delete
to authenticated
using (private.is_cohort_staff_member(cohort_id));

drop policy if exists "cohort staff insert enrolments" on public.cohort_enrolments;
create policy "cohort staff insert enrolments"
on public.cohort_enrolments
for insert
to authenticated
with check (private.is_cohort_staff_member(cohort_id));

drop policy if exists "cohort staff update enrolments" on public.cohort_enrolments;
create policy "cohort staff update enrolments"
on public.cohort_enrolments
for update
to authenticated
using (private.is_cohort_staff_member(cohort_id))
with check (private.is_cohort_staff_member(cohort_id));
