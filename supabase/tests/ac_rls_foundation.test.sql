begin;
create extension if not exists pgtap with schema extensions;
select plan(22);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'institutions', 'institutions table exists');
select has_table('public', 'institution_memberships', 'institution memberships table exists');
select has_table('public', 'cohorts', 'cohorts table exists');
select has_table('public', 'enrolments', 'enrolments table exists');
select has_table('public', 'curriculum_releases', 'curriculum releases table exists');
select has_table('public', 'lesson_progress', 'lesson progress table exists');
select has_table('public', 'responses', 'responses table exists');
select has_table('public', 'portfolio_evidence', 'portfolio evidence table exists');
select has_table('public', 'assessment_attempts', 'assessment attempts table exists');
select has_table('public', 'audit_events', 'audit events table exists');

select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='profiles'),'profiles has RLS enabled');
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='lesson_progress'),'lesson_progress has RLS enabled');
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='responses'),'responses has RLS enabled');
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='portfolio_evidence'),'portfolio_evidence has RLS enabled');
select ok((select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='assessment_attempts'),'assessment_attempts has RLS enabled');

select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='responses' and policyname='responses_select_owner_or_staff'),'responses has owner/staff select policy');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='responses' and policyname='responses_insert_owner'),'responses has owner insert policy');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='responses' and policyname='responses_update_owner'),'responses has owner update policy');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='responses' and policyname='responses_delete_owner'),'responses has owner delete policy');
select ok(not exists(select 1 from pg_policies where schemaname='public' and tablename='audit_events'),'audit_events has no client policy');

select ok(exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='private' and p.proname='can_access_learner'),'learner-scope security function exists');
select ok(exists(select 1 from pg_indexes where schemaname='public' and indexname='responses_learner_id_idx'),'responses learner lookup is indexed');
select ok(exists(select 1 from pg_indexes where schemaname='public' and indexname='lesson_progress_learner_id_idx'),'lesson progress learner lookup is indexed');

select * from finish();
rollback;
