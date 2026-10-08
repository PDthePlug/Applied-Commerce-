-- Applied Commerce Milestone 7: institutional provisioning and cohort administration
--
-- The existing AC school/cohort tables are the system of record. This migration
-- activates them without introducing a parallel institution model.

create unique index if not exists school_memberships_school_user_uidx
  on public.school_memberships (school_id, user_id);
create unique index if not exists cohort_staff_cohort_user_uidx
  on public.cohort_staff (cohort_id, user_id);
create unique index if not exists cohort_enrolments_cohort_learner_uidx
  on public.cohort_enrolments (cohort_id, learner_id);

create index if not exists school_memberships_user_school_idx
  on public.school_memberships (user_id, school_id);
create index if not exists cohorts_school_status_idx
  on public.cohorts (school_id, status);
create index if not exists cohort_staff_user_cohort_idx
  on public.cohort_staff (user_id, cohort_id);
create index if not exists cohort_enrolments_learner_cohort_idx
  on public.cohort_enrolments (learner_id, cohort_id);

drop policy if exists "school admins insert memberships" on public.school_memberships;
create policy "school admins insert memberships" on public.school_memberships
for insert to authenticated
with check (private.has_school_role(school_id, array['owner'::text,'admin'::text]));

drop policy if exists "school admins update memberships" on public.school_memberships;
create policy "school admins update memberships" on public.school_memberships
for update to authenticated
using (private.has_school_role(school_id, array['owner'::text,'admin'::text]))
with check (private.has_school_role(school_id, array['owner'::text,'admin'::text]));

drop policy if exists "school admins delete memberships" on public.school_memberships;
create policy "school admins delete memberships" on public.school_memberships
for delete to authenticated
using (private.has_school_role(school_id, array['owner'::text,'admin'::text]));

drop policy if exists "school admins update schools" on public.schools;
create policy "school admins update schools" on public.schools
for update to authenticated
using (private.has_school_role(id, array['owner'::text,'admin'::text]))
with check (private.has_school_role(id, array['owner'::text,'admin'::text]));

drop policy if exists "school owners delete schools" on public.schools;
create policy "school owners delete schools" on public.schools
for delete to authenticated
using (private.has_school_role(id, array['owner'::text]));

drop policy if exists "school admins insert cohorts" on public.cohorts;
create policy "school admins insert cohorts" on public.cohorts
for insert to authenticated
with check (private.has_school_role(school_id, array['owner'::text,'admin'::text]));

drop policy if exists "school admins update cohorts" on public.cohorts;
create policy "school admins update cohorts" on public.cohorts
for update to authenticated
using (private.has_school_role(school_id, array['owner'::text,'admin'::text]))
with check (private.has_school_role(school_id, array['owner'::text,'admin'::text]));

drop policy if exists "school admins delete cohorts" on public.cohorts;
create policy "school admins delete cohorts" on public.cohorts
for delete to authenticated
using (private.has_school_role(school_id, array['owner'::text,'admin'::text]));

create or replace function private.is_cohort_admin(target_cohort uuid)
returns boolean
language sql
stable
security definer
set search_path=''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.cohorts c
      join public.school_memberships sm on sm.school_id=c.school_id
      where c.id=target_cohort
        and sm.user_id=(select auth.uid())
        and sm.status='active'
        and sm.role in ('owner','admin')
    );
$$;

revoke execute on function private.is_cohort_admin(uuid) from public, anon;
grant execute on function private.is_cohort_admin(uuid) to authenticated;

drop policy if exists "cohorts_select" on public.cohorts;
create policy "cohorts_select" on public.cohorts
for select to authenticated
using (
  private.is_cohort_staff_member(id)
  or private.has_school_role(school_id,array['owner'::text,'admin'::text])
  or exists (
    select 1
    from public.cohort_enrolments ce
    where ce.cohort_id=cohorts.id
      and ce.learner_id=(select auth.uid())
      and ce.status in ('active','completed')
  )
);

drop policy if exists "school admins insert cohort staff" on public.cohort_staff;
create policy "school admins insert cohort staff" on public.cohort_staff
for insert to authenticated
with check (private.is_cohort_admin(cohort_id));

drop policy if exists "school admins update cohort staff" on public.cohort_staff;
create policy "school admins update cohort staff" on public.cohort_staff
for update to authenticated
using (private.is_cohort_admin(cohort_id))
with check (private.is_cohort_admin(cohort_id));

drop policy if exists "school admins delete cohort staff" on public.cohort_staff;
create policy "school admins delete cohort staff" on public.cohort_staff
for delete to authenticated
using (private.is_cohort_admin(cohort_id));

drop policy if exists "cohort staff insert enrolments" on public.cohort_enrolments;
create policy "cohort staff insert enrolments" on public.cohort_enrolments
for insert to authenticated
with check (
  private.is_cohort_staff_member(cohort_id)
  or private.has_school_role(
    (select c.school_id from public.cohorts c where c.id=cohort_id),
    array['owner'::text,'admin'::text]
  )
);

drop policy if exists "cohort staff update enrolments" on public.cohort_enrolments;
create policy "cohort staff update enrolments" on public.cohort_enrolments
for update to authenticated
using (
  private.is_cohort_staff_member(cohort_id)
  or private.has_school_role(
    (select c.school_id from public.cohorts c where c.id=cohort_id),
    array['owner'::text,'admin'::text]
  )
)
with check (
  private.is_cohort_staff_member(cohort_id)
  or private.has_school_role(
    (select c.school_id from public.cohorts c where c.id=cohort_id),
    array['owner'::text,'admin'::text]
  )
);

drop policy if exists "cohort staff delete enrolments" on public.cohort_enrolments;
create policy "cohort staff delete enrolments" on public.cohort_enrolments
for delete to authenticated
using (
  private.is_cohort_staff_member(cohort_id)
  or private.has_school_role(
    (select c.school_id from public.cohorts c where c.id=cohort_id),
    array['owner'::text,'admin'::text]
  )
);

-- Privileged implementations live in the private schema. Public RPCs below
-- are SECURITY INVOKER wrappers so the exposed API surface never itself runs
-- with elevated privileges.

create or replace function private.create_school_impl(p_name text,p_slug text)
returns public.schools
language plpgsql
security definer
set search_path=''
as $$
declare
  v_school public.schools;
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise insufficient_privilege using message='Authentication required';
  end if;
  if trim(p_name)='' or trim(p_slug)='' then
    raise invalid_parameter_value using message='School name and slug are required';
  end if;
  if lower(trim(p_slug)) !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise invalid_parameter_value using message='Slug must use lowercase letters, numbers and hyphens';
  end if;

  insert into public.schools(name,slug)
  values(trim(p_name),lower(trim(p_slug)))
  returning * into v_school;

  insert into public.school_memberships(school_id,user_id,role,status)
  values(v_school.id,v_uid,'owner','active');

  insert into public.audit_events(actor_user_id,school_id,event_type,entity_type,entity_id,metadata)
  values(
    v_uid,v_school.id,'school.created','school',v_school.id,
    jsonb_build_object('name',v_school.name)
  );

  return v_school;
exception when unique_violation then
  raise unique_violation using message='A school with that slug or membership already exists';
end;
$$;

create or replace function public.create_school(p_name text,p_slug text)
returns public.schools
language sql
security invoker
set search_path=''
as $$
  select private.create_school_impl(p_name,p_slug);
$$;

create or replace function private.add_school_member_by_email_impl(
  p_school_id uuid,p_email text,p_role text default 'educator'
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid;
  v_user uuid := (select auth.uid());
begin
  if v_user is null
     or not private.has_school_role(p_school_id,array['owner'::text,'admin'::text])
  then
    raise insufficient_privilege using message='School administration access required';
  end if;

  if p_role not in ('owner','admin','educator') then
    raise invalid_parameter_value using message='Invalid school role';
  end if;

  if p_role='owner'
     and not private.has_school_role(p_school_id,array['owner'::text])
  then
    raise insufficient_privilege using message='Only an existing school owner can assign the owner role';
  end if;

  select u.id
  into v_uid
  from auth.users u
  where lower(u.email)=lower(trim(p_email))
    and coalesce(u.is_anonymous,false)=false
  limit 1;

  if v_uid is null then
    raise foreign_key_violation using message='No existing Applied Commerce account matches that email';
  end if;

  insert into public.school_memberships(school_id,user_id,role,status)
  values(p_school_id,v_uid,p_role,'active')
  on conflict (school_id,user_id)
  do update set role=excluded.role,status='active',updated_at=now();

  insert into public.audit_events(actor_user_id,school_id,event_type,entity_type,entity_id,metadata)
  values(
    v_user,p_school_id,'school.member_added','user',v_uid,
    jsonb_build_object('role',p_role)
  );

  return v_uid;
end;
$$;

create or replace function public.add_school_member_by_email(
  p_school_id uuid,p_email text,p_role text default 'educator'
)
returns uuid
language sql
security invoker
set search_path=''
as $$
  select private.add_school_member_by_email_impl(p_school_id,p_email,p_role);
$$;

create or replace function private.add_cohort_staff_by_email_impl(
  p_cohort_id uuid,p_email text,p_role text default 'educator'
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid;
  v_user uuid := (select auth.uid());
  v_school uuid;
begin
  select c.school_id into v_school
  from public.cohorts c
  where c.id=p_cohort_id;

  if v_user is null
     or v_school is null
     or not private.has_school_role(v_school,array['owner'::text,'admin'::text])
  then
    raise insufficient_privilege using message='School administration access required';
  end if;

  if p_role not in ('lead','educator','assistant') then
    raise invalid_parameter_value using message='Invalid cohort staff role';
  end if;

  select u.id
  into v_uid
  from auth.users u
  where lower(u.email)=lower(trim(p_email))
    and coalesce(u.is_anonymous,false)=false
  limit 1;

  if v_uid is null then
    raise foreign_key_violation using message='No existing Applied Commerce account matches that email';
  end if;

  if not exists (
    select 1
    from public.school_memberships sm
    where sm.school_id=v_school
      and sm.user_id=v_uid
      and sm.status='active'
  ) then
    raise foreign_key_violation using message='The facilitator must first be an active member of this school';
  end if;

  insert into public.cohort_staff(cohort_id,user_id,role,status)
  values(p_cohort_id,v_uid,p_role,'active')
  on conflict (cohort_id,user_id)
  do update set role=excluded.role,status='active',updated_at=now();

  insert into public.audit_events(actor_user_id,school_id,event_type,entity_type,entity_id,metadata)
  values(
    v_user,v_school,'cohort.staff_added','cohort',p_cohort_id,
    jsonb_build_object('user_id',v_uid,'role',p_role)
  );

  return v_uid;
end;
$$;

create or replace function public.add_cohort_staff_by_email(
  p_cohort_id uuid,p_email text,p_role text default 'educator'
)
returns uuid
language sql
security invoker
set search_path=''
as $$
  select private.add_cohort_staff_by_email_impl(p_cohort_id,p_email,p_role);
$$;

create or replace function private.enrol_learner_by_email_impl(
  p_cohort_id uuid,p_email text
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_uid uuid;
  v_user uuid := (select auth.uid());
  v_school uuid;
begin
  select c.school_id into v_school
  from public.cohorts c
  where c.id=p_cohort_id;

  if v_user is null or v_school is null
     or (
       not private.is_cohort_staff_member(p_cohort_id)
       and not private.has_school_role(v_school,array['owner'::text,'admin'::text])
     )
  then
    raise insufficient_privilege using message='Cohort administration access required';
  end if;

  select u.id
  into v_uid
  from auth.users u
  where lower(u.email)=lower(trim(p_email))
    and coalesce(u.is_anonymous,false)=false
  limit 1;

  if v_uid is null then
    raise foreign_key_violation using message='No existing Applied Commerce account matches that email';
  end if;

  insert into public.cohort_enrolments(cohort_id,learner_id,status)
  values(p_cohort_id,v_uid,'active')
  on conflict (cohort_id,learner_id)
  do update set status='active',completed_at=null,updated_at=now();

  insert into public.audit_events(actor_user_id,school_id,event_type,entity_type,entity_id,metadata)
  values(
    v_user,v_school,'cohort.learner_enrolled','learner',v_uid,
    jsonb_build_object('cohort_id',p_cohort_id)
  );

  return v_uid;
end;
$$;

create or replace function public.enrol_learner_by_email(
  p_cohort_id uuid,p_email text
)
returns uuid
language sql
security invoker
set search_path=''
as $$
  select private.enrol_learner_by_email_impl(p_cohort_id,p_email);
$$;

revoke execute on function private.create_school_impl(text,text) from public,anon;
revoke execute on function private.add_school_member_by_email_impl(uuid,text,text) from public,anon;
revoke execute on function private.add_cohort_staff_by_email_impl(uuid,text,text) from public,anon;
revoke execute on function private.enrol_learner_by_email_impl(uuid,text) from public,anon;

grant usage on schema private to authenticated;
grant execute on function private.create_school_impl(text,text) to authenticated;
grant execute on function private.add_school_member_by_email_impl(uuid,text,text) to authenticated;
grant execute on function private.add_cohort_staff_by_email_impl(uuid,text,text) to authenticated;
grant execute on function private.enrol_learner_by_email_impl(uuid,text) to authenticated;

revoke execute on function public.create_school(text,text) from public,anon;
revoke execute on function public.add_school_member_by_email(uuid,text,text) from public,anon;
revoke execute on function public.add_cohort_staff_by_email(uuid,text,text) from public,anon;
revoke execute on function public.enrol_learner_by_email(uuid,text) from public,anon;

grant execute on function public.create_school(text,text) to authenticated;
grant execute on function public.add_school_member_by_email(uuid,text,text) to authenticated;
grant execute on function public.add_cohort_staff_by_email(uuid,text,text) to authenticated;
grant execute on function public.enrol_learner_by_email(uuid,text) to authenticated;

grant select,insert,update,delete
on public.schools,public.school_memberships,public.cohorts,public.cohort_staff,public.cohort_enrolments
to authenticated;
