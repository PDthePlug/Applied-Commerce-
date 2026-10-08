-- Milestone 7 institutional provisioning smoke assertions
select case when exists (select 1 from pg_indexes where indexname='school_memberships_school_user_uidx') then 'ok' else 'fail' end as unique_school_membership;
select case when exists (select 1 from pg_indexes where indexname='cohort_staff_cohort_user_uidx') then 'ok' else 'fail' end as unique_cohort_staff;
select case when exists (select 1 from pg_indexes where indexname='cohort_enrolments_cohort_learner_uidx') then 'ok' else 'fail' end as unique_cohort_enrolment;
select case when exists (select 1 from pg_policies where tablename='cohorts' and policyname='school admins insert cohorts') then 'ok' else 'fail' end as cohort_insert_policy;
select case when exists (select 1 from pg_policies where tablename='cohort_staff' and policyname='school admins insert cohort staff') then 'ok' else 'fail' end as staff_insert_policy;
select case when exists (select 1 from pg_policies where tablename='cohort_enrolments' and policyname='cohort staff insert enrolments') then 'ok' else 'fail' end as enrolment_insert_policy;
select case when exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='create_school' and p.prosecdef=false) then 'ok' else 'fail' end as public_bootstrap_wrapper_is_invoker;
select case when exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='create_school_impl' and p.prosecdef=true) then 'ok' else 'fail' end as private_bootstrap_impl_secure;
select case when not has_function_privilege('anon','public.create_school(text,text)','EXECUTE') then 'ok' else 'fail' end as bootstrap_not_anonymous;
select case when not has_function_privilege('anon','public.resolve_school_account(uuid,text)','EXECUTE') then 'ok' else 'fail' end as resolve_not_anonymous;
select case when exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='is_cohort_admin' and p.prosecdef=true) then 'ok' else 'fail' end as cohort_admin_helper_secure;
