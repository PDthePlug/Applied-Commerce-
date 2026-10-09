-- Milestone 6 security and migration reconciliation
drop index if exists public.evidence_records_learner_response_key_uidx;

drop policy if exists "assigned staff inserts evidence" on public.evidence_records;
create policy "assigned staff inserts evidence"
on public.evidence_records
for insert
to authenticated
with check (private.can_review_learner(learner_id));

drop policy if exists "learner or assigned staff updates evidence" on public.evidence_records;
create policy "learner or assigned staff updates evidence"
on public.evidence_records
for update
to authenticated
using (
  (select auth.uid()) = learner_id
  or private.can_review_learner(learner_id)
)
with check (
  (select auth.uid()) = learner_id
  or private.can_review_learner(learner_id)
);

create or replace function public.upsert_facilitator_evidence_record(
  p_learner_id uuid,
  p_response_key text,
  p_response_value text,
  p_auto_result jsonb default '{}'::jsonb,
  p_status text default 'captured'
)
returns uuid
language plpgsql
security invoker
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
  set response_value=excluded.response_value,
      auto_result=excluded.auto_result,
      status=excluded.status,
      updated_at=now()
  returning * into v_record;
  return v_record.id;
end;
$$;

revoke execute on function public.upsert_facilitator_evidence_record(uuid,text,text,jsonb,text) from public;
revoke execute on function public.upsert_facilitator_evidence_record(uuid,text,text,jsonb,text) from anon;
grant execute on function public.upsert_facilitator_evidence_record(uuid,text,text,jsonb,text) to authenticated;
