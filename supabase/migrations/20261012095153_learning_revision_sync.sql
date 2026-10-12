-- Additive revision metadata; no learner content is rewritten or removed.
alter table public.prompt_responses add column sync_revision bigint not null default 1 check (sync_revision > 0);
alter table public.lesson_notes add column sync_revision bigint not null default 1 check (sync_revision > 0);
alter table public.lesson_progress add column sync_revision bigint not null default 1 check (sync_revision > 0);
alter table public.learner_profiles add column sync_revision bigint not null default 1 check (sync_revision > 0);

create function private.advance_learning_revision() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Opening a lesson must not invalidate a concurrent completion change.
  new.sync_revision := old.sync_revision + 1;
  if tg_table_name = 'lesson_progress' then
    if new.status is not distinct from old.status and new.completed_at is not distinct from old.completed_at then new.sync_revision := old.sync_revision; end if;
  end if;
  return new;
end; $$;
revoke all on function private.advance_learning_revision() from public,anon,authenticated;
create trigger advance_learning_revision before update on public.prompt_responses for each row execute function private.advance_learning_revision();
create trigger advance_learning_revision before update on public.lesson_notes for each row execute function private.advance_learning_revision();
create trigger advance_learning_revision before update on public.lesson_progress for each row execute function private.advance_learning_revision();
create trigger advance_learning_revision before update on public.learner_profiles for each row execute function private.advance_learning_revision();

create function public.save_learning_changes(p_changes jsonb, p_opened_unit text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid(); v_release uuid; v_item jsonb; v_kind text; v_key text;
  v_unit text; v_value jsonb; v_current jsonb; v_expected bigint; v_revision bigint;
  v_match text[]; v_grade smallint; v_term smallint; v_results jsonb := '[]';
  v_profile public.learner_profiles%rowtype;
begin
  if v_uid is null or not private.has_active_session() then raise insufficient_privilege using message='Sign in before saving learning work'; end if;
  if not exists (select 1 from public.profiles where id=v_uid and status='active') then
    raise insufficient_privilege using message='An active account is required';
  end if;
  if jsonb_typeof(p_changes) is distinct from 'array' or jsonb_array_length(p_changes)>500
    or octet_length(p_changes::text)>1048576 then
    raise invalid_parameter_value using message='Invalid learning change batch';
  end if;
  select id into strict v_release from public.curriculum_releases where release_key='ac-runtime-3';
  -- Serialize all saves for this account, including insertion races. A transaction
  -- cannot write another account: ownership comes only from the verified JWT.
  perform pg_advisory_xact_lock(hashtextextended(v_uid::text,0));
  if exists (select 1 from jsonb_array_elements(p_changes) x
    group by x->>'kind',x->>'key' having count(*)>1) then
    raise invalid_parameter_value using message='Duplicate learning change';
  end if;
  for v_item in select value from jsonb_array_elements(p_changes) order by value->>'kind',value->>'key' loop
    v_kind:=v_item->>'kind'; v_key:=v_item->>'key'; v_value:=v_item->'value';
    if v_kind is null or v_kind not in ('prompt','note','completion','profile')
      or v_key is null or length(v_key)>400 or (v_item->>'expected') is null
      or (v_item->>'expected') !~ '^[0-9]{1,15}$' then
      raise invalid_parameter_value using message='Invalid learning change';
    end if;
    v_expected:=(v_item->>'expected')::bigint; v_revision:=0; v_current:=null;
    if v_kind='profile' then
      if v_key<>'self' or jsonb_typeof(v_value) is distinct from 'object'
        or jsonb_typeof(v_value->'displayName') is distinct from 'string' or length(v_value->>'displayName')>80
        or not (v_value ? 'grade') or not ((v_value->'grade')='null'::jsonb or ((v_value->>'grade') ~ '^(8|9|10|11|12)$')) then
        raise invalid_parameter_value using message='Invalid learning profile';
      end if;
      -- Preserve the existing product rule: staff and platform admins have no
      -- learner profile. Their local learning profile remains device-specific.
      if private.is_platform_admin() or exists(select 1 from public.school_memberships where user_id=v_uid and status='active')
        or exists(select 1 from public.cohort_staff where user_id=v_uid and status='active') then
        raise insufficient_privilege using message='Learner profile is unavailable for this role';
      end if;
      select * into v_profile from public.learner_profiles where user_id=v_uid for update;
      if found then v_revision:=v_profile.sync_revision; v_current:=jsonb_build_object('displayName',coalesce(v_profile.preferred_name,''),'grade',v_profile.current_grade); end if;
    else
      v_unit:=split_part(v_key,'::',1); v_match:=regexp_match(v_unit,'^g(8|9|10|11|12)-t([1-4])-[a-zA-Z0-9_-]+$');
      if v_match is null or (v_kind='prompt' and v_key !~ '::prompt-[a-zA-Z0-9_-]+::[a-zA-Z0-9_-]+$')
        or (v_kind<>'prompt' and v_key<>v_unit) then
        raise invalid_parameter_value using message='Invalid lesson identity';
      end if;
      v_grade:=v_match[1]::smallint; v_term:=v_match[2]::smallint;
      if (v_kind in ('note','prompt') and (jsonb_typeof(v_value) is distinct from 'string' or length(v_value#>>'{}')>100000))
        or (v_kind='completion' and jsonb_typeof(v_value) is distinct from 'boolean') then
        raise invalid_parameter_value using message='Invalid learning value';
      end if;
      if v_kind='prompt' then
        select sync_revision,response into v_revision,v_current from public.prompt_responses where learner_id=v_uid and curriculum_version='ac-runtime-3' and unit_id=v_unit and prompt_key=v_key for update;
      elsif v_kind='note' then
        select sync_revision,to_jsonb(note) into v_revision,v_current from public.lesson_notes where learner_id=v_uid and curriculum_version='ac-runtime-3' and unit_id=v_unit for update;
      else
        select sync_revision,to_jsonb(status='completed') into v_revision,v_current from public.lesson_progress where learner_id=v_uid and curriculum_version='ac-runtime-3' and unit_id=v_unit for update;
      end if;
      v_revision:=coalesce(v_revision,0);
    end if;
    -- Equal values acknowledge retries without advancing a revision. Different
    -- values require the exact baseline revision, irrespective of client time.
    if v_value is distinct from v_current and v_expected<>v_revision then
      v_results:=v_results||jsonb_build_array(jsonb_build_object('kind',v_kind,'key',v_key,'value',v_current,'revision',v_revision,'conflict',true));
      continue;
    end if;
    if v_value is distinct from v_current then
      if v_kind='profile' then
        insert into public.learner_profiles(user_id,preferred_name,current_grade) values(v_uid,nullif(v_value->>'displayName',''),(v_value->>'grade')::smallint)
          on conflict(user_id) do update set preferred_name=excluded.preferred_name,current_grade=excluded.current_grade returning sync_revision into v_revision;
      elsif v_kind='prompt' then
        insert into public.prompt_responses(learner_id,curriculum_version,curriculum_release_id,grade,term,unit_id,prompt_key,response,response_kind)
          values(v_uid,'ac-runtime-3',v_release,v_grade,v_term,v_unit,v_key,v_value,'text')
          on conflict(learner_id,curriculum_version,unit_id,prompt_key) do update set response=excluded.response,answered_at=now() returning sync_revision into v_revision;
      elsif v_kind='note' then
        insert into public.lesson_notes(learner_id,curriculum_version,curriculum_release_id,grade,term,unit_id,note)
          values(v_uid,'ac-runtime-3',v_release,v_grade,v_term,v_unit,v_value#>>'{}')
          on conflict(learner_id,curriculum_version,unit_id) do update set note=excluded.note returning sync_revision into v_revision;
      else
        insert into public.lesson_progress(learner_id,curriculum_version,curriculum_release_id,grade,term,unit_id,status,completed_at)
          values(v_uid,'ac-runtime-3',v_release,v_grade,v_term,v_unit,case when v_value='true' then 'completed' else 'in_progress' end,case when v_value='true' then now() else null end)
          on conflict(learner_id,curriculum_version,unit_id) do update set status=excluded.status,completed_at=excluded.completed_at returning sync_revision into v_revision;
      end if;
    end if;
    v_results:=v_results||jsonb_build_array(jsonb_build_object('kind',v_kind,'key',v_key,'value',v_value,'revision',v_revision,'conflict',false));
  end loop;
  if p_opened_unit is not null then
    v_match:=regexp_match(p_opened_unit,'^g(8|9|10|11|12)-t([1-4])-[a-zA-Z0-9_-]+$');
    if v_match is null then raise invalid_parameter_value using message='Invalid opened lesson'; end if;
    insert into public.lesson_progress(learner_id,curriculum_version,curriculum_release_id,grade,term,unit_id,last_opened_at)
      values(v_uid,'ac-runtime-3',v_release,v_match[1]::smallint,v_match[2]::smallint,p_opened_unit,now())
      on conflict(learner_id,curriculum_version,unit_id) do update set last_opened_at=excluded.last_opened_at;
  end if;
  if p_opened_unit is not null and not exists(select 1 from jsonb_array_elements(v_results) x where x->>'kind'='completion' and x->>'key'=p_opened_unit) then
    select sync_revision,to_jsonb(status='completed') into v_revision,v_current from public.lesson_progress where learner_id=v_uid and curriculum_version='ac-runtime-3' and unit_id=p_opened_unit;
    v_results:=v_results||jsonb_build_array(jsonb_build_object('kind','completion','key',p_opened_unit,'value',v_current,'revision',v_revision,'conflict',false));
  end if;
  return v_results;
end; $$;
revoke all on function public.save_learning_changes(jsonb,text) from public,anon;
grant execute on function public.save_learning_changes(jsonb,text) to authenticated;
-- Stale clients cannot bypass conflict checks with unconditional writes/deletes.

