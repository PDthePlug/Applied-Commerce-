-- Milestone 7 institutional activation smoke assertions.
-- The live schema already contains the provisioning functions; this test guards the contract
-- used by the new operations surface without creating a parallel institutional model.

select case when exists (
  select 1 from information_schema.tables
  where table_schema='public' and table_name in ('schools','school_memberships','cohorts','cohort_staff','cohort_enrolments')
) then 1 else 0 end as institutional_tables_exist;

select case when exists (
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='create_school'
) then 1 else 0 end as create_school_rpc_exists;

select case when exists (
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='add_school_member_by_email'
) then 1 else 0 end as school_member_rpc_exists;

select case when exists (
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='add_cohort_staff_by_email'
) then 1 else 0 end as cohort_staff_rpc_exists;

select case when exists (
  select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='enrol_learner_by_email'
) then 1 else 0 end as learner_enrolment_rpc_exists;

select case when (
  select prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='create_school'
  limit 1
) = false then 1 else 0 end as public_create_school_is_invoker;

select case when (
  select prosecdef from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='private' and p.proname='create_school_impl'
  limit 1
) = true then 1 else 0 end as private_create_school_is_definer;

select case when not exists (
  select 1
  from information_schema.role_routine_grants
  where routine_schema='public'
    and routine_name in ('create_school','add_school_member_by_email','add_cohort_staff_by_email','enrol_learner_by_email')
    and grantee='anon'
    and privilege_type='EXECUTE'
) then 1 else 0 end as anonymous_provisioning_execute_denied;

select case when exists (
  select 1 from pg_policies
  where schemaname='public'
    and tablename='cohorts'
    and policyname='school admins insert cohorts'
) then 1 else 0 end as cohort_admin_insert_policy_exists;

select case when exists (
  select 1 from pg_policies
  where schemaname='public'
    and tablename='cohort_enrolments'
    and policyname='cohort staff insert enrolments'
) then 1 else 0 end as enrolment_insert_policy_exists;
