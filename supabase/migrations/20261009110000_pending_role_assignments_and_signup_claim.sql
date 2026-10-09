-- Support assigning school, cohort-staff and learner roles before an email
-- address has registered. Assignments remain private and activate only for the
-- Auth user that registers with the matching normalized email address.
create table if not exists private.pending_role_assignments (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null,
  role_type text not null check (role_type in ('school_member','cohort_staff','learner')),
  school_id uuid not null references public.schools(id) on delete cascade,
  cohort_id uuid references public.cohorts(id) on delete cascade,
  role text not null,
  assigned_by uuid references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','applied','rejected','cancelled')),
  claimed_user_id uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pending_role_assignment_shape check (
    (role_type = 'school_member' and cohort_id is null and role in ('owner','admin','educator'))
    or (role_type = 'cohort_staff' and cohort_id is not null and role in ('lead','educator','assistant'))
    or (role_type = 'learner' and cohort_id is not null and role = 'learner')
  )
);

create unique index if not exists pending_role_assignments_unique_pending_scope
  on private.pending_role_assignments (
    email_normalized, role_type, school_id, coalesce(cohort_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) where status = 'pending';
create index if not exists pending_role_assignments_pending_email
  on private.pending_role_assignments(email_normalized, created_at)
  where status = 'pending';

alter table private.pending_role_assignments enable row level security;
revoke all on table private.pending_role_assignments from anon, authenticated;

create or replace function private.guard_pending_role_assignment()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  new.email_normalized := lower(trim(new.email_normalized));
  if new.email_normalized = '' or new.email_normalized !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise invalid_parameter_value using message = 'A valid email address is required for a pending role assignment';
  end if;

  if new.status = 'pending' and new.role_type = 'learner' and exists (
    select 1 from private.pending_role_assignments p
    where p.email_normalized = new.email_normalized and p.status = 'pending'
      and p.role_type in ('school_member','cohort_staff') and p.id is distinct from new.id
  ) then
    raise check_violation using message = 'This email already has a pending staff assignment and cannot also be assigned as a learner';
  end if;

  if new.status = 'pending' and new.role_type in ('school_member','cohort_staff') and exists (
    select 1 from private.pending_role_assignments p
    where p.email_normalized = new.email_normalized and p.status = 'pending'
      and p.role_type = 'learner' and p.id is distinct from new.id
  ) then
    raise check_violation using message = 'This email already has a pending learner assignment and cannot also be assigned as staff';
  end if;

  new.updated_at := now();
  return new;
end;
$function$;

drop trigger if exists guard_pending_role_assignment on private.pending_role_assignments;
create trigger guard_pending_role_assignment
before insert or update of email_normalized, role_type, school_id, cohort_id, role, status
on private.pending_role_assignments
for each row execute function private.guard_pending_role_assignment();

create or replace function private.apply_pending_role_assignments_after_signup()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_assignment private.pending_role_assignments%rowtype;
  v_error text;
begin
  if new.email is null or coalesce(new.is_anonymous, false) then
    return new;
  end if;

  insert into public.profiles(id, display_name, status)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''), 'active')
  on conflict (id) do nothing;

  for v_assignment in
    select p.*
    from private.pending_role_assignments p
    where p.email_normalized = lower(trim(new.email)) and p.status = 'pending'
    order by case p.role_type when 'school_member' then 1 when 'cohort_staff' then 2 else 3 end,
             p.created_at, p.id
    for update
  loop
    begin
      if exists (
        select 1 from private.platform_admins pa
        where pa.user_id = new.id and pa.status = 'active'
      ) then
        raise check_violation using message = 'Platform administrators cannot receive learner, institution or facilitator assignments';
      end if;

      if v_assignment.role_type = 'school_member' then
        delete from public.learner_profiles where user_id = new.id;
        insert into public.school_memberships(school_id, user_id, role, status)
        values (v_assignment.school_id, new.id, v_assignment.role, 'active')
        on conflict (school_id, user_id) do update
          set role = excluded.role, status = 'active', updated_at = now();

      elsif v_assignment.role_type = 'cohort_staff' then
        if not exists (
          select 1 from public.school_memberships sm
          where sm.school_id = v_assignment.school_id and sm.user_id = new.id and sm.status = 'active'
        ) then
          raise foreign_key_violation using message = 'Facilitator assignment requires an active school membership';
        end if;
        delete from public.learner_profiles where user_id = new.id;
        insert into public.cohort_staff(cohort_id, user_id, role, status)
        values (v_assignment.cohort_id, new.id, v_assignment.role, 'active')
        on conflict (cohort_id, user_id) do update
          set role = excluded.role, status = 'active', updated_at = now();

      elsif v_assignment.role_type = 'learner' then
        if exists (
          select 1 from public.school_memberships sm where sm.user_id = new.id and sm.status = 'active'
        ) or exists (
          select 1 from public.cohort_staff cs where cs.user_id = new.id and cs.status = 'active'
        ) then
          raise check_violation using message = 'This account already has staff access and cannot also be assigned as a learner';
        end if;
        insert into public.learner_profiles(user_id)
        values (new.id)
        on conflict (user_id) do nothing;
        insert into public.cohort_enrolments(cohort_id, learner_id, status)
        values (v_assignment.cohort_id, new.id, 'active')
        on conflict (cohort_id, learner_id) do update
          set status = 'active', completed_at = null, updated_at = now();
      end if;

      update private.pending_role_assignments
      set status = 'applied', claimed_user_id = new.id, claimed_at = now(),
          failure_reason = null, updated_at = now()
      where id = v_assignment.id;

      insert into public.audit_events(actor_user_id, school_id, event_type, entity_type, entity_id, metadata)
      values (
        v_assignment.assigned_by, v_assignment.school_id, 'pending_role.applied', 'user', new.id,
        jsonb_build_object('assignment_id', v_assignment.id, 'email', lower(trim(new.email)),
          'role_type', v_assignment.role_type, 'role', v_assignment.role, 'cohort_id', v_assignment.cohort_id)
      );
    exception when others then
      get stacked diagnostics v_error = message_text;
      update private.pending_role_assignments
      set status = 'rejected', claimed_user_id = new.id, claimed_at = now(),
          failure_reason = left(v_error, 500), updated_at = now()
      where id = v_assignment.id;
      insert into public.audit_events(actor_user_id, school_id, event_type, entity_type, entity_id, metadata)
      values (
        v_assignment.assigned_by, v_assignment.school_id, 'pending_role.rejected', 'user', new.id,
        jsonb_build_object('assignment_id', v_assignment.id, 'email', lower(trim(new.email)),
          'role_type', v_assignment.role_type, 'role', v_assignment.role, 'reason', left(v_error, 500))
      );
    end;
  end loop;

  return new;
end;
$function$;

drop trigger if exists on_auth_user_created_apply_pending_roles on auth.users;
create trigger on_auth_user_created_apply_pending_roles
after insert on auth.users
for each row execute function private.apply_pending_role_assignments_after_signup();

create or replace function private.add_school_member_by_email_impl(p_school_id uuid, p_email text, p_role text default 'educator')
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid;
  v_user uuid := (select auth.uid());
  v_converted_learner boolean := false;
  v_email text := lower(trim(p_email));
begin
  if v_user is null or not private.has_school_role(p_school_id, array['owner','admin']::text[]) then
    raise insufficient_privilege using message = 'School administration access required';
  end if;
  if p_role not in ('owner','admin','educator') then
    raise invalid_parameter_value using message = 'Invalid school role';
  end if;
  if p_role = 'owner' and not private.has_school_role(p_school_id, array['owner']::text[]) then
    raise insufficient_privilege using message = 'Only an existing school owner can assign the owner role';
  end if;
  if v_email is null or v_email = '' then
    raise invalid_parameter_value using message = 'A valid email address is required';
  end if;

  select u.id into v_uid from auth.users u
  where lower(u.email) = v_email and coalesce(u.is_anonymous, false) = false
  limit 1;

  if v_uid is null then
    insert into private.pending_role_assignments(email_normalized, role_type, school_id, cohort_id, role, assigned_by)
    values (v_email, 'school_member', p_school_id, null, p_role, v_user)
    on conflict do nothing;
    insert into public.audit_events(actor_user_id, school_id, event_type, entity_type, metadata)
    values (v_user, p_school_id, 'school.member_assignment_pending', 'email',
      jsonb_build_object('email', v_email, 'role', p_role));
    return null;
  end if;

  if exists (select 1 from private.platform_admins pa where pa.user_id = v_uid and pa.status = 'active') then
    raise check_violation using message = 'The platform administrator cannot be assigned an institution role.';
  end if;

  delete from public.learner_profiles where user_id = v_uid;
  v_converted_learner := found;
  insert into public.school_memberships(school_id, user_id, role, status)
  values (p_school_id, v_uid, p_role, 'active')
  on conflict (school_id, user_id) do update set role = excluded.role, status = 'active', updated_at = now();

  insert into public.audit_events(actor_user_id, school_id, event_type, entity_type, entity_id, metadata)
  values (v_user, p_school_id, 'school.member_added', 'user', v_uid,
    jsonb_build_object('role', p_role, 'converted_from_learner', v_converted_learner));
  return v_uid;
end;
$function$;

create or replace function private.add_cohort_staff_by_email_impl(p_cohort_id uuid, p_email text, p_role text default 'educator')
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid;
  v_user uuid := (select auth.uid());
  v_school uuid;
  v_converted_learner boolean := false;
  v_email text := lower(trim(p_email));
begin
  select c.school_id into v_school from public.cohorts c where c.id = p_cohort_id;
  if v_user is null or v_school is null or not private.has_school_role(v_school, array['owner','admin']::text[]) then
    raise insufficient_privilege using message = 'School administration access required';
  end if;
  if p_role not in ('lead','educator','assistant') then
    raise invalid_parameter_value using message = 'Invalid cohort staff role';
  end if;
  if v_email is null or v_email = '' then
    raise invalid_parameter_value using message = 'A valid email address is required';
  end if;

  select u.id into v_uid from auth.users u
  where lower(u.email) = v_email and coalesce(u.is_anonymous, false) = false
  limit 1;

  if v_uid is null then
    if not exists (
      select 1 from private.pending_role_assignments p
      where p.email_normalized = v_email and p.school_id = v_school
        and p.role_type = 'school_member' and p.status = 'pending'
    ) then
      insert into private.pending_role_assignments(email_normalized, role_type, school_id, cohort_id, role, assigned_by)
      values (v_email, 'school_member', v_school, null, 'educator', v_user)
      on conflict do nothing;
    end if;
    insert into private.pending_role_assignments(email_normalized, role_type, school_id, cohort_id, role, assigned_by)
    values (v_email, 'cohort_staff', v_school, p_cohort_id, p_role, v_user)
    on conflict do nothing;
    insert into public.audit_events(actor_user_id, school_id, event_type, entity_type, entity_id, metadata)
    values (v_user, v_school, 'cohort.staff_assignment_pending', 'cohort', p_cohort_id,
      jsonb_build_object('email', v_email, 'role', p_role));
    return null;
  end if;

  if exists (select 1 from private.platform_admins pa where pa.user_id = v_uid and pa.status = 'active') then
    raise check_violation using message = 'The platform administrator cannot be assigned a facilitator role.';
  end if;
  if not exists (
    select 1 from public.school_memberships sm
    where sm.school_id = v_school and sm.user_id = v_uid and sm.status = 'active'
  ) then
    raise foreign_key_violation using message = 'The facilitator must first be an active member of this school';
  end if;

  delete from public.learner_profiles where user_id = v_uid;
  v_converted_learner := found;
  insert into public.cohort_staff(cohort_id, user_id, role, status)
  values (p_cohort_id, v_uid, p_role, 'active')
  on conflict (cohort_id, user_id) do update set role = excluded.role, status = 'active', updated_at = now();

  insert into public.audit_events(actor_user_id, school_id, event_type, entity_type, entity_id, metadata)
  values (v_user, v_school, 'cohort.staff_added', 'cohort', p_cohort_id,
    jsonb_build_object('user_id', v_uid, 'role', p_role, 'converted_from_learner', v_converted_learner));
  return v_uid;
end;
$function$;

create or replace function private.enrol_learner_by_email_impl(p_cohort_id uuid, p_email text)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_uid uuid;
  v_user uuid := (select auth.uid());
  v_school uuid;
  v_email text := lower(trim(p_email));
begin
  select c.school_id into v_school from public.cohorts c where c.id = p_cohort_id;
  if v_user is null or v_school is null or (
    not private.is_cohort_staff_member(p_cohort_id)
    and not private.has_school_role(v_school, array['owner','admin']::text[])
  ) then
    raise insufficient_privilege using message = 'Cohort administration access required';
  end if;
  if v_email is null or v_email = '' then
    raise invalid_parameter_value using message = 'A valid email address is required';
  end if;

  select u.id into v_uid from auth.users u
  where lower(u.email) = v_email and coalesce(u.is_anonymous, false) = false
  limit 1;

  if v_uid is null then
    insert into private.pending_role_assignments(email_normalized, role_type, school_id, cohort_id, role, assigned_by)
    values (v_email, 'learner', v_school, p_cohort_id, 'learner', v_user)
    on conflict do nothing;
    insert into public.audit_events(actor_user_id, school_id, event_type, entity_type, entity_id, metadata)
    values (v_user, v_school, 'cohort.learner_assignment_pending', 'cohort', p_cohort_id,
      jsonb_build_object('email', v_email));
    return null;
  end if;

  if exists (select 1 from private.platform_admins pa where pa.user_id = v_uid and pa.status = 'active')
     or exists (select 1 from public.school_memberships sm where sm.user_id = v_uid and sm.status = 'active')
     or exists (select 1 from public.cohort_staff cs where cs.user_id = v_uid and cs.status = 'active') then
    raise check_violation using message = 'This account is assigned to staff or administration and cannot be enrolled as a learner.';
  end if;

  insert into public.learner_profiles(user_id) values (v_uid) on conflict (user_id) do nothing;
  insert into public.cohort_enrolments(cohort_id, learner_id, status)
  values (p_cohort_id, v_uid, 'active')
  on conflict (cohort_id, learner_id) do update set status = 'active', completed_at = null, updated_at = now();

  insert into public.audit_events(actor_user_id, school_id, event_type, entity_type, entity_id, metadata)
  values (v_user, v_school, 'cohort.learner_enrolled', 'learner', v_uid,
    jsonb_build_object('cohort_id', p_cohort_id));
  return v_uid;
end;
$function$;
