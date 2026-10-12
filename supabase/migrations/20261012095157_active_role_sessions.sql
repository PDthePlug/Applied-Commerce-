-- JWTs remain cryptographically valid after logout. Require their real Auth
-- session for private data and privileged actions, without client-set role claims.
create function private.has_active_session() returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from auth.sessions s join auth.users u on u.id=s.user_id
      join public.profiles p on p.id=u.id
    where s.id=case when (auth.jwt()->>'session_id') ~ '^[0-9a-fA-F-]{36}$' then (auth.jwt()->>'session_id')::uuid else null end
      and s.user_id=auth.uid() and (s.not_after is null or s.not_after>now())
      and u.deleted_at is null and (u.banned_until is null or u.banned_until<now())
      and p.status='active'
  );
$$;
revoke all on function private.has_active_session() from public,anon;
grant execute on function private.has_active_session() to authenticated;
create function public.has_active_session() returns boolean
language sql stable security invoker set search_path='' as $$ select private.has_active_session(); $$;
revoke all on function public.has_active_session() from public,anon;
grant execute on function public.has_active_session() to authenticated;

CREATE OR REPLACE FUNCTION private.can_review_learner(target_learner uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select (select auth.uid()) is not null and private.has_active_session() and (
  private.is_platform_admin()
  or exists (select 1 from public.cohort_enrolments ce join public.cohort_staff cs on cs.cohort_id=ce.cohort_id
    where ce.learner_id=target_learner and ce.status='active' and cs.user_id=auth.uid() and cs.status='active')
  or exists (select 1 from public.cohort_enrolments ce join public.cohorts c on c.id=ce.cohort_id
    join public.school_memberships sm on sm.school_id=c.school_id
    where ce.learner_id=target_learner and ce.status='active' and sm.user_id=auth.uid()
      and sm.status='active' and sm.role in ('owner','admin'))
); $function$
;

CREATE OR REPLACE FUNCTION private.can_view_learner(target_learner uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select (select auth.uid()) is not null and private.has_active_session() and (
  private.is_platform_admin() or auth.uid()=target_learner
  or exists (select 1 from public.cohort_enrolments ce join public.cohort_staff cs on cs.cohort_id=ce.cohort_id
    where ce.learner_id=target_learner and ce.status='active' and cs.user_id=auth.uid() and cs.status='active')
  or exists (select 1 from public.cohort_enrolments ce join public.cohorts c on c.id=ce.cohort_id
    join public.school_memberships sm on sm.school_id=c.school_id
    where ce.learner_id=target_learner and ce.status='active' and sm.user_id=auth.uid()
      and sm.status='active' and sm.role in ('owner','admin'))
); $function$
;

CREATE OR REPLACE FUNCTION private.has_school_role(target_school uuid, target_roles text[] DEFAULT NULL::text[])
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select (select auth.uid()) is not null and private.has_active_session() and (
  private.is_platform_admin() or exists (
    select 1 from public.school_memberships sm
    where sm.school_id=target_school and sm.user_id=(select auth.uid())
      and sm.status='active' and (target_roles is null or sm.role=any(target_roles))
  )
); $function$
;

CREATE OR REPLACE FUNCTION private.is_cohort_admin(target_cohort uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select (select auth.uid()) is not null and private.has_active_session() and (
  private.is_platform_admin() or exists (
    select 1 from public.cohorts c join public.school_memberships sm on sm.school_id=c.school_id
    where c.id=target_cohort and sm.user_id=(select auth.uid()) and sm.status='active' and sm.role in ('owner','admin')
  )
); $function$
;

CREATE OR REPLACE FUNCTION private.is_cohort_staff_member(target_cohort uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select (select auth.uid()) is not null and private.has_active_session() and (
  private.is_platform_admin()
  or exists (select 1 from public.cohort_staff cs where cs.cohort_id=target_cohort and cs.user_id=auth.uid() and cs.status='active')
  or exists (select 1 from public.cohorts c join public.school_memberships sm on sm.school_id=c.school_id
    where c.id=target_cohort and sm.user_id=auth.uid() and sm.status='active' and sm.role in ('owner','admin'))
); $function$
;

CREATE OR REPLACE FUNCTION private.is_platform_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select (select auth.uid()) is not null and private.has_active_session() and exists (
  select 1 from private.platform_admins pa
  where pa.user_id=(select auth.uid()) and pa.status='active'
); $function$
;

-- Restrictive policy ANDs with every existing role/ownership policy. The
-- session lookup is an init-plan per statement, not a check for every row.
do $$ declare t record; begin
  for t in select tablename from pg_tables where schemaname='public' loop
    execute format('create policy active_auth_session on public.%I as restrictive for all to authenticated using ((select private.has_active_session())) with check ((select private.has_active_session()))',t.tablename);
  end loop;
end; $$;

-- Apply only explicitly edited settings under the account lock. No stale
-- read/merge/upsert cycle can overwrite unrelated preferences from a device.
create function public.save_account_preferences(p_patch jsonb) returns public.account_preferences
language plpgsql security definer set search_path='' as $$
declare v_uid uuid:=auth.uid(); v_row public.account_preferences;
begin
  if not private.has_active_session() then raise insufficient_privilege using message='Active session required'; end if;
  if jsonb_typeof(p_patch) is distinct from 'object' or p_patch='{}'::jsonb
    or exists(select 1 from jsonb_object_keys(p_patch) k where k not in ('appearance','accent','textSize','readingWidth'))
    or (p_patch ? 'appearance' and coalesce(p_patch->>'appearance','') not in ('system','light','warm','dark'))
    or (p_patch ? 'accent' and coalesce(p_patch->>'accent','') not in ('commerce','blue','amber','sage'))
    or (p_patch ? 'textSize' and coalesce(p_patch->>'textSize','') not in ('small','standard','large','extra_large'))
    or (p_patch ? 'readingWidth' and coalesce(p_patch->>'readingWidth','') not in ('narrow','standard','wide')) then
    raise invalid_parameter_value using message='Invalid preferences';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text,0));
  insert into public.account_preferences(user_id,appearance,accent,text_size,reading_width)
    values(v_uid,coalesce(p_patch->>'appearance','system'),coalesce(p_patch->>'accent','commerce'),coalesce(p_patch->>'textSize','standard'),coalesce(p_patch->>'readingWidth','standard'))
    on conflict(user_id) do update set
      appearance=case when p_patch ? 'appearance' then excluded.appearance else account_preferences.appearance end,
      accent=case when p_patch ? 'accent' then excluded.accent else account_preferences.accent end,
      text_size=case when p_patch ? 'textSize' then excluded.text_size else account_preferences.text_size end,
      reading_width=case when p_patch ? 'readingWidth' then excluded.reading_width else account_preferences.reading_width end
    returning * into v_row;
  return v_row;
end; $$;
revoke all on function public.save_account_preferences(jsonb) from public,anon;
grant execute on function public.save_account_preferences(jsonb) to authenticated;

