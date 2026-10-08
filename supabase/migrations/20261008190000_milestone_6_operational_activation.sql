-- Milestone 6: operational activation
insert into public.curriculum_releases
  (release_key, source_release_key, runtime_format_version, compiler_version, schema_version, published_at, metadata)
values
  ('ac-runtime-3', null, 3, 'governed-runtime', 1, now(),
   '{"curriculumSourceStatus":"not-source-fingerprinted","releaseManifest":"public/curriculum/release.json"}'::jsonb)
on conflict (release_key) do update
set runtime_format_version=excluded.runtime_format_version,
    compiler_version=excluded.compiler_version,
    schema_version=excluded.schema_version,
    metadata=excluded.metadata;

delete from public.lesson_progress legacy
where legacy.curriculum_version='runtime-3'
  and exists (select 1 from public.lesson_progress current_release where current_release.learner_id=legacy.learner_id and current_release.unit_id=legacy.unit_id and current_release.curriculum_version='ac-runtime-3');

delete from public.prompt_responses legacy
where legacy.curriculum_version='runtime-3'
  and exists (select 1 from public.prompt_responses current_release where current_release.learner_id=legacy.learner_id and current_release.unit_id=legacy.unit_id and current_release.prompt_key=legacy.prompt_key and current_release.curriculum_version='ac-runtime-3');

delete from public.lesson_notes legacy
where legacy.curriculum_version='runtime-3'
  and exists (select 1 from public.lesson_notes current_release where current_release.learner_id=legacy.learner_id and current_release.unit_id=legacy.unit_id and current_release.curriculum_version='ac-runtime-3');

update public.lesson_progress set curriculum_version='ac-runtime-3' where curriculum_version='runtime-3';
update public.prompt_responses set curriculum_version='ac-runtime-3' where curriculum_version='runtime-3';
update public.lesson_notes set curriculum_version='ac-runtime-3' where curriculum_version='runtime-3';

update public.lesson_progress set curriculum_release_id=(select id from public.curriculum_releases where release_key='ac-runtime-3') where curriculum_release_id is null and curriculum_version='ac-runtime-3';
update public.prompt_responses set curriculum_release_id=(select id from public.curriculum_releases where release_key='ac-runtime-3') where curriculum_release_id is null and curriculum_version='ac-runtime-3';
update public.lesson_notes set curriculum_release_id=(select id from public.curriculum_releases where release_key='ac-runtime-3') where curriculum_release_id is null and curriculum_version='ac-runtime-3';
update public.portfolio_artifacts set curriculum_release_id=(select id from public.curriculum_releases where release_key='ac-runtime-3') where curriculum_release_id is null and curriculum_version='ac-runtime-3';
update public.portfolio_evidence set curriculum_release_id=(select id from public.curriculum_releases where release_key='ac-runtime-3') where curriculum_release_id is null;

create unique index if not exists evidence_records_learner_response_key_uidx on public.evidence_records (learner_id,response_key);

create or replace function public.upsert_facilitator_evidence_record(
  p_learner_id uuid,
  p_response_key text,
  p_response_value text,
  p_auto_result jsonb default '{}'::jsonb,
  p_status text default 'captured'
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare v_record public.evidence_records;
begin
  if (select auth.uid()) is null then
    raise insufficient_privilege using message='Authentication required';
  end if;
  if not private.can_review_learner(p_learner_id) then
    raise insufficient_privilege using message='Learner is outside the facilitator access scope';
  end if;
  insert into public.evidence_records(learner_id,response_key,response_value,auto_result,status,captured_at,updated_at)
  values(p_learner_id,p_response_key,p_response_value,p_auto_result,p_status,now(),now())
  on conflict (learner_id,response_key) do update
  set response_value=excluded.response_value,auto_result=excluded.auto_result,status=excluded.status,updated_at=now()
  returning * into v_record;
  return v_record.id;
end;
$$;

revoke execute on function public.upsert_facilitator_evidence_record(uuid,text,text,jsonb,text) from public;
revoke execute on function public.upsert_facilitator_evidence_record(uuid,text,text,jsonb,text) from anon;
grant execute on function public.upsert_facilitator_evidence_record(uuid,text,text,jsonb,text) to authenticated;
