-- Applied Commerce initial domain foundation
-- Milestone 2
--
-- Repository-managed only at this stage. Validate against a local/branch
-- database before production push. No learner data is migrated.

create extension if not exists pgcrypto;
create schema if not exists private;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.institution_memberships (
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','facilitator','viewer')),
  created_at timestamptz not null default now(),
  primary key (institution_id, user_id)
);

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table public.enrolments (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  learner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (cohort_id, learner_id)
);

create table public.curriculum_releases (
  id uuid primary key default gen_random_uuid(),
  release_key text not null unique,
  source_release_key text,
  compiler_version text not null,
  schema_version integer not null,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  curriculum_release_id uuid not null references public.curriculum_releases(id) on delete restrict,
  unit_id text not null,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','completed')),
  completion_percent numeric(5,2) not null default 0
    check (completion_percent >= 0 and completion_percent <= 100),
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, curriculum_release_id, unit_id)
);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  curriculum_release_id uuid not null references public.curriculum_releases(id) on delete restrict,
  response_key text not null,
  unit_id text not null,
  block_id text not null,
  slot text not null,
  value jsonb not null default '{}'::jsonb,
  is_complete boolean not null default false,
  last_saved_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id, curriculum_release_id, response_key)
);

create table public.portfolio_evidence (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  curriculum_release_id uuid references public.curriculum_releases(id) on delete restrict,
  response_id uuid references public.responses(id) on delete set null,
  title text not null,
  evidence_type text not null,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  curriculum_release_id uuid not null references public.curriculum_releases(id) on delete restrict,
  unit_id text not null,
  attempt_number integer not null check (attempt_number > 0),
  status text not null default 'in_progress'
    check (status in ('in_progress','submitted','reviewed')),
  score numeric(6,2),
  result jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  unique (learner_id, curriculum_release_id, unit_id, attempt_number)
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  institution_id uuid references public.institutions(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index institution_memberships_user_id_idx on public.institution_memberships using btree (user_id);
create index cohorts_institution_id_idx on public.cohorts using btree (institution_id);
create index enrolments_learner_id_idx on public.enrolments using btree (learner_id);
create index lesson_progress_learner_id_idx on public.lesson_progress using btree (learner_id);
create index lesson_progress_release_unit_idx on public.lesson_progress using btree (curriculum_release_id, unit_id);
create index responses_learner_id_idx on public.responses using btree (learner_id);
create index responses_release_unit_idx on public.responses using btree (curriculum_release_id, unit_id);
create index portfolio_evidence_learner_id_idx on public.portfolio_evidence using btree (learner_id);
create index assessment_attempts_learner_id_idx on public.assessment_attempts using btree (learner_id);
create index audit_events_institution_id_idx on public.audit_events using btree (institution_id);
create index audit_events_actor_user_id_idx on public.audit_events using btree (actor_user_id);

create or replace function private.is_institution_member(
  p_institution_id uuid,
  p_user_id uuid default (select auth.uid())
)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.institution_memberships m
    where m.institution_id = p_institution_id and m.user_id = p_user_id
  );
$$;

create or replace function private.has_institution_role(
  p_institution_id uuid,
  p_roles text[],
  p_user_id uuid default (select auth.uid())
)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.institution_memberships m
    where m.institution_id = p_institution_id
      and m.user_id = p_user_id
      and m.role = any(p_roles)
  );
$$;

create or replace function private.can_access_learner(
  p_learner_id uuid,
  p_roles text[] default array['owner','admin','facilitator','viewer']::text[],
  p_user_id uuid default (select auth.uid())
)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.institution_memberships m
    join public.cohorts c on c.institution_id = m.institution_id
    join public.enrolments e on e.cohort_id = c.id
    where m.user_id = p_user_id
      and m.role = any(p_roles)
      and e.learner_id = p_learner_id
  );
$$;

revoke execute on function private.is_institution_member(uuid, uuid) from public;
revoke execute on function private.has_institution_role(uuid, text[], uuid) from public;
revoke execute on function private.can_access_learner(uuid, text[], uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_institution_member(uuid, uuid) to authenticated;
grant execute on function private.has_institution_role(uuid, text[], uuid) to authenticated;
grant execute on function private.can_access_learner(uuid, text[], uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.institutions enable row level security;
alter table public.institution_memberships enable row level security;
alter table public.cohorts enable row level security;
alter table public.enrolments enable row level security;
alter table public.curriculum_releases enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.responses enable row level security;
alter table public.portfolio_evidence enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.audit_events enable row level security;

revoke all on table
  public.profiles, public.institutions, public.institution_memberships,
  public.cohorts, public.enrolments, public.curriculum_releases,
  public.lesson_progress, public.responses, public.portfolio_evidence,
  public.assessment_attempts, public.audit_events
from anon;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.institutions to authenticated;
grant select, insert, update, delete on public.institution_memberships to authenticated;
grant select, insert, update, delete on public.cohorts to authenticated;
grant select, insert, update, delete on public.enrolments to authenticated;
grant select on public.curriculum_releases to authenticated;
grant select, insert, update on public.lesson_progress to authenticated;
grant select, insert, update, delete on public.responses to authenticated;
grant select, insert, update, delete on public.portfolio_evidence to authenticated;
grant select, insert, update on public.assessment_attempts to authenticated;

create policy "profiles_select_self_or_institution_staff" on public.profiles for select to authenticated
using (id = (select auth.uid()) or private.can_access_learner(id));

create policy "profiles_insert_self" on public.profiles for insert to authenticated
with check (id = (select auth.uid()));

create policy "profiles_update_self" on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "institutions_select_member" on public.institutions for select to authenticated
using (private.is_institution_member(id));

create policy "institutions_insert_authenticated" on public.institutions for insert to authenticated
with check (true);

create policy "institutions_update_owner_admin" on public.institutions for update to authenticated
using (private.has_institution_role(id, array['owner','admin']))
with check (private.has_institution_role(id, array['owner','admin']));

create policy "institutions_delete_owner" on public.institutions for delete to authenticated
using (private.has_institution_role(id, array['owner']));

create policy "memberships_select_member" on public.institution_memberships for select to authenticated
using (user_id = (select auth.uid()) or private.is_institution_member(institution_id));

create policy "memberships_insert_owner_admin" on public.institution_memberships for insert to authenticated
with check (private.has_institution_role(institution_id, array['owner','admin']));

create policy "memberships_update_owner_admin" on public.institution_memberships for update to authenticated
using (private.has_institution_role(institution_id, array['owner','admin']))
with check (private.has_institution_role(institution_id, array['owner','admin']));

create policy "memberships_delete_owner_admin" on public.institution_memberships for delete to authenticated
using (private.has_institution_role(institution_id, array['owner','admin']));

create policy "cohorts_select_member" on public.cohorts for select to authenticated
using (private.is_institution_member(institution_id));

create policy "cohorts_insert_staff" on public.cohorts for insert to authenticated
with check (private.has_institution_role(institution_id, array['owner','admin','facilitator']));

create policy "cohorts_update_staff" on public.cohorts for update to authenticated
using (private.has_institution_role(institution_id, array['owner','admin','facilitator']))
with check (private.has_institution_role(institution_id, array['owner','admin','facilitator']));

create policy "cohorts_delete_admin" on public.cohorts for delete to authenticated
using (private.has_institution_role(institution_id, array['owner','admin']));

create policy "enrolments_select_learner_or_staff" on public.enrolments for select to authenticated
using (
  learner_id = (select auth.uid())
  or exists (
    select 1 from public.cohorts c
    where c.id = cohort_id and private.is_institution_member(c.institution_id)
  )
);

create policy "enrolments_insert_staff" on public.enrolments for insert to authenticated
with check (
  exists (
    select 1 from public.cohorts c
    where c.id = cohort_id
      and private.has_institution_role(c.institution_id, array['owner','admin','facilitator'])
  )
);

create policy "enrolments_update_staff" on public.enrolments for update to authenticated
using (
  exists (
    select 1 from public.cohorts c
    where c.id = cohort_id
      and private.has_institution_role(c.institution_id, array['owner','admin','facilitator'])
  )
)
with check (
  exists (
    select 1 from public.cohorts c
    where c.id = cohort_id
      and private.has_institution_role(c.institution_id, array['owner','admin','facilitator'])
  )
);

create policy "enrolments_delete_staff" on public.enrolments for delete to authenticated
using (
  exists (
    select 1 from public.cohorts c
    where c.id = cohort_id
      and private.has_institution_role(c.institution_id, array['owner','admin'])
  )
);

create policy "curriculum_releases_select_authenticated" on public.curriculum_releases for select to authenticated
using (true);

create policy "lesson_progress_select_owner_or_staff" on public.lesson_progress for select to authenticated
using (learner_id = (select auth.uid()) or private.can_access_learner(learner_id));

create policy "lesson_progress_insert_owner" on public.lesson_progress for insert to authenticated
with check (learner_id = (select auth.uid()));

create policy "lesson_progress_update_owner" on public.lesson_progress for update to authenticated
using (learner_id = (select auth.uid())) with check (learner_id = (select auth.uid()));

create policy "responses_select_owner_or_staff" on public.responses for select to authenticated
using (learner_id = (select auth.uid()) or private.can_access_learner(learner_id));

create policy "responses_insert_owner" on public.responses for insert to authenticated
with check (learner_id = (select auth.uid()));

create policy "responses_update_owner" on public.responses for update to authenticated
using (learner_id = (select auth.uid())) with check (learner_id = (select auth.uid()));

create policy "responses_delete_owner" on public.responses for delete to authenticated
using (learner_id = (select auth.uid()));

create policy "portfolio_evidence_select_owner_or_staff" on public.portfolio_evidence for select to authenticated
using (learner_id = (select auth.uid()) or private.can_access_learner(learner_id));

create policy "portfolio_evidence_insert_owner" on public.portfolio_evidence for insert to authenticated
with check (learner_id = (select auth.uid()));

create policy "portfolio_evidence_update_owner" on public.portfolio_evidence for update to authenticated
using (learner_id = (select auth.uid())) with check (learner_id = (select auth.uid()));

create policy "portfolio_evidence_delete_owner" on public.portfolio_evidence for delete to authenticated
using (learner_id = (select auth.uid()));

create policy "assessment_attempts_select_owner_or_staff" on public.assessment_attempts for select to authenticated
using (learner_id = (select auth.uid()) or private.can_access_learner(learner_id));

create policy "assessment_attempts_insert_owner" on public.assessment_attempts for insert to authenticated
with check (learner_id = (select auth.uid()));

create policy "assessment_attempts_update_owner" on public.assessment_attempts for update to authenticated
using (learner_id = (select auth.uid())) with check (learner_id = (select auth.uid()));

-- audit_events intentionally has no client grants or policies.
