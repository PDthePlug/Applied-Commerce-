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
as $
  select private.is_platform_admin();
$;
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
as $
declare
  v_school public.schools;
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;
  if trim(p_name) = '' or trim(p_slug) = '' then
    raise invalid_parameter_value using message = 'School name and slug are required';
  end if;
  if lower(trim(p_slug)) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*
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
 then
    raise invalid_parameter_value using message = 'Slug must use lowercase letters, numbers and hyphens';
  end if;

  insert into public.schools(name, slug)
  values (trim(p_name), lower(trim(p_slug)))
  returning * into v_school;

  if not private.is_platform_admin() then
    insert into public.school_memberships(school_id, user_id, role, status)
    values (v_school.id, v_uid, 'owner', 'active');
  end if;

  insert into public.audit_events(actor_user_id, school_id, event_type, entity_type, entity_id, metadata)
  values (v_uid, v_school.id, 'school.created', 'school', v_school.id,
          jsonb_build_object('name', v_school.name, 'created_by_platform_admin', private.is_platform_admin()));

  return v_school;
exception when unique_violation then
  raise unique_violation using message = 'A school with that slug or membership already exists';
end;
$;

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
