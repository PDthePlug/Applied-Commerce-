-- Logical stale-answer rejection must not request transaction retries.
-- PostgREST 14 can retry SQLSTATE 40001 indefinitely; P0001 returns HTTP 400.
-- Keep the existing authorization, row lock and atomic review operation.
begin;
create or replace function private.lock_review_response(p_learner_id uuid,p_response_key text,p_response_value text)
returns void language plpgsql security definer set search_path='' as $$
declare v_response jsonb;
begin
  if (select auth.uid()) is null or not private.can_review_learner(p_learner_id) then
    raise insufficient_privilege using message='Authorized facilitator required';
  end if;
  select pr.response into v_response from public.prompt_responses pr
    join public.curriculum_releases cr on cr.id=pr.curriculum_release_id
    where pr.learner_id=p_learner_id and pr.prompt_key=p_response_key and cr.release_key='ac-runtime-3' for update of pr;
  if not found or jsonb_typeof(v_response)<>'string' or (v_response#>>'{}') is distinct from p_response_value then
    raise exception using message='The learner answer changed; reload it before reviewing';
  end if;
end;
$$;
commit;
