-- Applied Commerce platform superuser foundation.
-- Global administrators are stored in a non-exposed schema; user-editable auth metadata is never trusted.

create table if not exists private.platform_admins (
  user_id uuid primary key references auth.users(id) on delete restrict,
  status text not null default 'active' check (status in ('active','disabled')),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

revoke all on table private.platform_admins from public, anon, authenticated;

create or replace function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1 from private.platform_admins pa
      where pa.user_id = (select auth.uid())
        and pa.status = 'active'
    );
$$;
revoke execute on function private.is_platform_admin() from public, anon;
grant execute on function private.is_platform_admin() to authenticated;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select private.is_platform_admin();
$$;
revoke execute on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

create or replace function private.has_school_role(target_school uuid, target_roles text[] default null::text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    private.is_platform_admin()
    or exists (
      select 1 from public.school_memberships sm
      where sm.school_id = target_school
        and sm.user_id = (select auth.uid())
        and sm.status = 'active'
        and (target_roles is null or sm.role = any(target_roles))
    )
  );
$$;

create or replace function private.is_cohort_admin(target_cohort uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    private.is_platform_admin()
    or exists (
      select 1 from public.cohorts c
      join public.school_memberships sm on sm.school_id = c.school_id
      where c.id = target_cohort
        and sm.user_id = (select auth.uid())
        and sm.status = 'active'
        and sm.role in ('owner','admin')
    )
  );
$$;

create or replace function private.is_cohort_staff_member(target_cohort uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    private.is_platform_admin()
    or exists (
      select 1 from public.cohort_staff cs
      where cs.cohort_id = target_cohort
        and cs.user_id = (select auth.uid())
        and cs.status = 'active'
    )
    or exists (
      select 1 from public.cohorts c
      join public.school_memberships sm on sm.school_id = c.school_id
      where c.id = target_cohort
        and sm.user_id = (select auth.uid())
        and sm.status = 'active'
        and sm.role in ('owner','admin')
    )
  );
$$;

create or replace function private.can_view_learner(target_learner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    private.is_platform_admin()
    or (select auth.uid()) = target_learner
    or exists (
      select 1 from public.cohort_enrolments ce
      join public.cohort_staff cs on cs.cohort_id = ce.cohort_id
      where ce.learner_id = target_learner
        and ce.status = 'active'
        and cs.user_id = (select auth.uid())
        and cs.status = 'active'
    )
    or exists (
      select 1 from public.cohort_enrolments ce
      join public.cohorts c on c.id = ce.cohort_id
      join public.school_memberships sm on sm.school_id = c.school_id
      where ce.learner_id = target_learner
        and ce.status = 'active'
        and sm.user_id = (select auth.uid())
        and sm.status = 'active'
        and sm.role in ('owner','admin')
    )
  );
$$;

create or replace function private.can_review_learner(target_learner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    private.is_platform_admin()
    or exists (
      select 1 from public.cohort_enrolments ce
      join public.cohort_staff cs on cs.cohort_id = ce.cohort_id
      where ce.learner_id = target_learner
        and ce.status = 'active'
        and cs.user_id = (select auth.uid())
        and cs.status = 'active'
    )
    or exists (
      select 1 from public.cohort_enrolments ce
      join public.cohorts c on c.id = ce.cohort_id
      join public.school_memberships sm on sm.school_id = c.school_id
      where ce.learner_id = target_learner
        and ce.status = 'active'
        and sm.user_id = (select auth.uid())
        and sm.status = 'active'
        and sm.role in ('owner','admin')
    )
  );
$$;

revoke execute on function private.has_school_role(uuid,text[]) from public, anon;
revoke execute on function private.is_cohort_admin(uuid) from public, anon;
revoke execute on function private.is_cohort_staff_member(uuid) from public, anon;
revoke execute on function private.can_view_learner(uuid) from public, anon;
revoke execute on function private.can_review_learner(uuid) from public, anon;
grant execute on function private.has_school_role(uuid,text[]) to authenticated;
grant execute on function private.is_cohort_admin(uuid) to authenticated;
grant execute on function private.is_cohort_staff_member(uuid) to authenticated;
grant execute on function private.can_view_learner(uuid) to authenticated;
grant execute on function private.can_review_learner(uuid) to authenticated;

-- Creating a school as a platform administrator must not silently add an institution role.
create or replace function private.create_school_impl(p_name text, p_slug text)
returns public.schools
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_school public.schools;
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or not private.is_platform_admin() then
    raise insufficient_privilege using message = 'Only platform administrators can create institutions';
  end if;
  if trim(p_name) = '' or trim(p_slug) = '' then
    raise invalid_parameter_value using message = 'School name and slug are required';
  end if;
  if lower(trim(p_slug)) !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
    raise invalid_parameter_value using message = 'Slug must use lowercase letters, numbers and hyphens';
  end if;

  insert into public.schools(name, slug)
  values (trim(p_name), lower(trim(p_slug)))
  returning * into v_school;

  insert into public.audit_events(actor_user_id, school_id, event_type, entity_type, entity_id, metadata)
  values (v_uid, v_school.id, 'school.created', 'school', v_school.id,
          jsonb_build_object('name', v_school.name, 'created_by_platform_admin', private.is_platform_admin()));

  return v_school;
exception when unique_violation then
  raise unique_violation using message = 'A school with that slug or membership already exists';
end;
$$;

revoke execute on function private.create_school_impl(text,text) from public, anon;
grant execute on function private.create_school_impl(text,text) to authenticated;

-- Provision the named platform administrator explicitly; never trust user-editable metadata.
insert into private.platform_admins (user_id, status)
select u.id, 'active'
from auth.users u
where lower(u.email) = 'pdmpofu@gmail.com'
on conflict (user_id) do update set status = 'active', updated_at = now();

-- The account is not to operate as a learner. Historical learning records remain untouched.
delete from public.learner_profiles
where user_id = (
  select id from auth.users where lower(email) = 'pdmpofu@gmail.com'
);

-- Create the requested AC platform institution if it does not already exist.
insert into public.schools (name, slug, status, metadata)
select 'Applied Commerce', 'applied-commerce', 'active',
       '{"purpose":"platform administration home; global authority is held separately"}'::jsonb
where not exists (
  select 1 from public.schools where lower(slug) = 'applied-commerce'
);


-- Enforce the operating-role boundary in the database, not only in UI navigation.
-- Learner progress and evidence remain attached to public.profiles; only the learner-role row is removed.
delete from public.learner_profiles lp
where exists (select 1 from private.platform_admins pa where pa.user_id=lp.user_id and pa.status='active')
   or exists (select 1 from public.school_memberships sm where sm.user_id=lp.user_id and sm.status='active')
   or exists (select 1 from public.cohort_staff cs where cs.user_id=lp.user_id and cs.status='active');

create or replace function private.enforce_exclusive_operating_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
begin
  if tg_table_name = 'learner_profiles' then
    v_uid := new.user_id;
    if exists (select 1 from private.platform_admins pa where pa.user_id=v_uid and pa.status='active')
       or exists (select 1 from public.school_memberships sm where sm.user_id=v_uid and sm.status='active')
       or exists (select 1 from public.cohort_staff cs where cs.user_id=v_uid and cs.status='active') then
      raise check_violation using message='This account is assigned an administrative or facilitator role and cannot also be a learner.';
    end if;
  elsif tg_table_name = 'school_memberships' then
    v_uid := new.user_id;
    if new.status = 'active' and exists (
      select 1 from private.platform_admins pa where pa.user_id=v_uid and pa.status='active'
    ) then
      raise check_violation using message='Platform administrators cannot be assigned institution-scoped roles.';
    end if;
    if new.status = 'active' and exists (
      select 1 from public.learner_profiles lp where lp.user_id=v_uid
    ) then
      raise check_violation using message='This account has a learner role. Assigning staff access will convert it to staff and preserve learning history.';
    end if;
  elsif tg_table_name = 'cohort_staff' then
    v_uid := new.user_id;
    if new.status = 'active' and exists (
      select 1 from private.platform_admins pa where pa.user_id=v_uid and pa.status='active'
    ) then
      raise check_violation using message='Platform administrators cannot be assigned facilitator roles.';
    end if;
    if new.status = 'active' and exists (
      select 1 from public.learner_profiles lp where lp.user_id=v_uid
    ) then
      raise check_violation using message='This account has a learner role. Assigning facilitator access will convert it to staff and preserve learning history.';
    end if;
  elsif tg_table_name = 'platform_admins' then
    v_uid := new.user_id;
    if new.status = 'active' and (
      exists (select 1 from public.learner_profiles lp where lp.user_id=v_uid)
      or exists (select 1 from public.school_memberships sm where sm.user_id=v_uid and sm.status='active')
      or exists (select 1 from public.cohort_staff cs where cs.user_id=v_uid and cs.status='active')
    ) then
      raise check_violation using message='A platform administrator must not also hold a learner, institution, or facilitator role.';
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function private.enforce_exclusive_operating_roles() from public, anon, authenticated;

drop trigger if exists learner_profiles_exclusive_operating_role on public.learner_profiles;
create trigger learner_profiles_exclusive_operating_role
before insert or update of user_id on public.learner_profiles
for each row execute function private.enforce_exclusive_operating_roles();

drop trigger if exists school_memberships_exclusive_operating_role on public.school_memberships;
create trigger school_memberships_exclusive_operating_role
before insert or update of user_id, status on public.school_memberships
for each row execute function private.enforce_exclusive_operating_roles();

drop trigger if exists cohort_staff_exclusive_operating_role on public.cohort_staff;
create trigger cohort_staff_exclusive_operating_role
before insert or update of user_id, status on public.cohort_staff
for each row execute function private.enforce_exclusive_operating_roles();

drop trigger if exists platform_admins_exclusive_operating_role on private.platform_admins;
create trigger platform_admins_exclusive_operating_role
before insert or update of user_id, status on private.platform_admins
for each row execute function private.enforce_exclusive_operating_roles();

-- Authorized staff assignment converts an existing learner account instead of creating a second account.
create or replace function private.add_school_member_by_email_impl(p_school_id uuid, p_email text, p_role text default 'educator')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_user uuid := (select auth.uid());
  v_converted_learner boolean := false;
begin
  if v_user is null or not private.has_school_role(p_school_id,array['owner'::text,'admin'::text]) then
    raise insufficient_privilege using message='School administration access required';
  end if;
  if p_role not in ('owner','admin','educator') then
    raise invalid_parameter_value using message='Invalid school role';
  end if;
  if p_role='owner' and not private.has_school_role(p_school_id,array['owner'::text]) then
    raise insufficient_privilege using message='Only an existing school owner can assign the owner role';
  end if;

  select u.id into v_uid from auth.users u
  where lower(u.email)=lower(trim(p_email)) and coalesce(u.is_anonymous,false)=false limit 1;
  if v_uid is null then
    raise foreign_key_violation using message='No existing Applied Commerce account matches that email';
  end if;
  if exists (select 1 from private.platform_admins pa where pa.user_id=v_uid and pa.status='active') then
    raise check_violation using message='The platform administrator cannot be assigned an institution role.';
  end if;

  delete from public.learner_profiles where user_id=v_uid;
  v_converted_learner := found;

  insert into public.school_memberships(school_id,user_id,role,status)
  values(p_school_id,v_uid,p_role,'active')
  on conflict (school_id,user_id) do update set role=excluded.role,status='active',updated_at=now();

  insert into public.audit_events(actor_user_id,school_id,event_type,entity_type,entity_id,metadata)
  values(v_user,p_school_id,'school.member_added','user',v_uid,
    jsonb_build_object('role',p_role,'converted_from_learner',v_converted_learner));
  return v_uid;
end;
$$;

create or replace function private.add_cohort_staff_by_email_impl(p_cohort_id uuid, p_email text, p_role text default 'educator')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_user uuid := (select auth.uid());
  v_school uuid;
  v_converted_learner boolean := false;
begin
  select c.school_id into v_school from public.cohorts c where c.id=p_cohort_id;
  if v_user is null or v_school is null or not private.has_school_role(v_school,array['owner'::text,'admin'::text]) then
    raise insufficient_privilege using message='School administration access required';
  end if;
  if p_role not in ('lead','educator','assistant') then
    raise invalid_parameter_value using message='Invalid cohort staff role';
  end if;
  select u.id into v_uid from auth.users u
  where lower(u.email)=lower(trim(p_email)) and coalesce(u.is_anonymous,false)=false limit 1;
  if v_uid is null then
    raise foreign_key_violation using message='No existing Applied Commerce account matches that email';
  end if;
  if exists (select 1 from private.platform_admins pa where pa.user_id=v_uid and pa.status='active') then
    raise check_violation using message='The platform administrator cannot be assigned a facilitator role.';
  end if;
  if not exists (select 1 from public.school_memberships sm where sm.school_id=v_school and sm.user_id=v_uid and sm.status='active') then
    raise foreign_key_violation using message='The facilitator must first be an active member of this school';
  end if;

  delete from public.learner_profiles where user_id=v_uid;
  v_converted_learner := found;

  insert into public.cohort_staff(cohort_id,user_id,role,status)
  values(p_cohort_id,v_uid,p_role,'active')
  on conflict (cohort_id,user_id) do update set role=excluded.role,status='active',updated_at=now();

  insert into public.audit_events(actor_user_id,school_id,event_type,entity_type,entity_id,metadata)
  values(v_user,v_school,'cohort.staff_added','cohort',p_cohort_id,
    jsonb_build_object('user_id',v_uid,'role',p_role,'converted_from_learner',v_converted_learner));
  return v_uid;
end;
$$;

create or replace function private.enrol_learner_by_email_impl(p_cohort_id uuid, p_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid;
  v_user uuid := (select auth.uid());
  v_school uuid;
begin
  select c.school_id into v_school from public.cohorts c where c.id=p_cohort_id;
  if v_user is null or v_school is null or (
    not private.is_cohort_staff_member(p_cohort_id)
    and not private.has_school_role(v_school,array['owner'::text,'admin'::text])
  ) then
    raise insufficient_privilege using message='Cohort administration access required';
  end if;

  select u.id into v_uid from auth.users u
  where lower(u.email)=lower(trim(p_email)) and coalesce(u.is_anonymous,false)=false limit 1;
  if v_uid is null then
    raise foreign_key_violation using message='No existing Applied Commerce account matches that email';
  end if;
  if exists (select 1 from private.platform_admins pa where pa.user_id=v_uid and pa.status='active')
     or exists (select 1 from public.school_memberships sm where sm.user_id=v_uid and sm.status='active')
     or exists (select 1 from public.cohort_staff cs where cs.user_id=v_uid and cs.status='active') then
    raise check_violation using message='This account is assigned to staff or administration and cannot be enrolled as a learner.';
  end if;

  insert into public.learner_profiles(user_id) values(v_uid) on conflict(user_id) do nothing;
  insert into public.cohort_enrolments(cohort_id,learner_id,status)
  values(p_cohort_id,v_uid,'active')
  on conflict (cohort_id,learner_id) do update set status='active',completed_at=null,updated_at=now();

  insert into public.audit_events(actor_user_id,school_id,event_type,entity_type,entity_id,metadata)
  values(v_user,v_school,'cohort.learner_enrolled','learner',v_uid,jsonb_build_object('cohort_id',p_cohort_id));
  return v_uid;
end;
$$;

revoke execute on function private.add_school_member_by_email_impl(uuid,text,text) from public, anon;
revoke execute on function private.add_cohort_staff_by_email_impl(uuid,text,text) from public, anon;
revoke execute on function private.enrol_learner_by_email_impl(uuid,text) from public, anon;
