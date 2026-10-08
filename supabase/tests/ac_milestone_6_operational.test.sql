-- Milestone 6 portable production smoke assertions

select case when exists (
  select 1 from public.curriculum_releases
  where release_key='ac-runtime-3'
    and runtime_format_version=3
    and source_release_key is null
    and metadata->>'curriculumSourceStatus'='not-source-fingerprinted'
) then 'ok' else 'fail' end as release_contract;

select case when not exists (select 1 from public.lesson_progress where curriculum_version='runtime-3' or curriculum_release_id is null) then 'ok' else 'fail' end as progress_release_binding;
select case when not exists (select 1 from public.prompt_responses where curriculum_version='runtime-3' or curriculum_release_id is null) then 'ok' else 'fail' end as response_release_binding;
select case when not exists (select 1 from public.lesson_notes where curriculum_version='runtime-3' or curriculum_release_id is null) then 'ok' else 'fail' end as note_release_binding;

select case when exists (select 1 from pg_indexes where schemaname='public' and indexname='evidence_records_learner_response_key_uidx') then 'ok' else 'fail' end as evidence_identity_index;
select case when exists (select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='upsert_facilitator_evidence_record') then 'ok' else 'fail' end as facilitator_write_function;
select case when not has_function_privilege('anon','public.upsert_facilitator_evidence_record(uuid,text,text,jsonb,text)','EXECUTE') then 'ok' else 'fail' end as anonymous_function_denied;