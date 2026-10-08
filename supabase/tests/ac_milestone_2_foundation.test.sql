-- AC Milestone 2 database foundation smoke assertions.
-- Execute in a disposable/test transaction or local branch; no data mutation.

select 'tables' as check_group,
       count(*) = 12 as passed,
       count(*) as observed
from information_schema.tables
where table_schema='public'
  and table_name in ('profiles','learner_profiles','schools','cohorts','cohort_enrolments','lesson_progress','prompt_responses','portfolio_artifacts','portfolio_evidence','curriculum_releases','assessment_attempts','audit_events');

select 'rls' as check_group,
       count(*) = 4 as passed,
       count(*) as observed
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relname in ('prompt_responses','evidence_records','assessment_attempts','audit_events')
  and c.relrowsecurity;

select 'stable-response-identity' as check_group,
       exists(select 1 from pg_indexes where schemaname='public' and indexname='prompt_responses_release_key_unique') as passed;

select 'stable-progress-identity' as check_group,
       exists(select 1 from pg_indexes where schemaname='public' and indexname='lesson_progress_release_unit_unique') as passed;

select 'evidence-scope' as check_group,
       exists(select 1 from pg_policies where schemaname='public' and tablename='evidence_records' and policyname='learner or assigned staff reads evidence') as passed;

select 'review-scope' as check_group,
       exists(select 1 from pg_policies where schemaname='public' and tablename='evidence_reviews' and policyname='assigned staff creates review') as passed;

select 'audit-client-isolation' as check_group,
       not exists(
         select 1 from information_schema.role_table_grants
         where table_schema='public' and table_name='audit_events'
           and grantee in ('anon','authenticated')
           and privilege_type in ('SELECT','INSERT','UPDATE','DELETE')
       ) as passed;

select 'review-helper' as check_group,
       exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='can_review_learner') as passed;
