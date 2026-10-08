-- Applied Commerce core persistence foundation
-- Milestone 2
--
-- This is the AC domain model documented by the existing activation contract.
-- It intentionally preserves AC terminology and stable prompt identities.
-- No BIS schema is copied.

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.learner_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  grade smallint check (grade between 8 and 12),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_memberships (
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','facilitator','viewer')),
  created_at timestamptz not null default now(),
  primary key (school_id,user_id)
);

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create table if not exists public.cohort_staff (
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'facilitator' check (role in ('facilitator','viewer')),
  created_at timestamptz not null default now(),
  primary key (cohort_id,user_id)
);

create table if not exists public.cohort_enrolments (
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  learner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (cohort_id,learner_id)
);

create table if not exists public.lesson_progress (
  learner_id uuid not null references auth.users(id) on delete cascade,
  unit_id text not null,
  grade smallint check (grade between 8 and 12),
  term smallint check (term between 1 and 4),
  completed boolean not null default false,
  completed_at timestamptz,
  last_opened_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (learner_id,unit_id)
);

create table if not exists public.prompt_responses (
  learner_id uuid not null references auth.users(id) on delete cascade,
  response_key text not null,
  unit_id text not null,
  prompt_id text not null,
  slot text not null,
  value text not null default '',
  is_complete boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (learner_id,response_key)
);

create table if not exists public.lesson_notes (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  unit_id text not null,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_artifacts (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  unit_id text,
  title text not null,
  artifact_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.portfolio_evidence (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  artifact_id uuid references public.portfolio_artifacts(id) on delete set null,
  unit_id text,
  evidence_type text not null,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_memberships_user_idx on public.school_memberships(user_id);
create index if not exists cohorts_school_idx on public.cohorts(school_id);
create index if not exists cohort_staff_user_idx on public.cohort_staff(user_id);
create index if not exists cohort_enrolments_learner_idx on public.cohort_enrolments(learner_id);
create index if not exists lesson_progress_learner_idx on public.lesson_progress(learner_id);
create index if not exists prompt_responses_learner_idx on public.prompt_responses(learner_id);
create index if not exists prompt_responses_unit_idx on public.prompt_responses(learner_id,unit_id);
create index if not exists lesson_notes_learner_unit_idx on public.lesson_notes(learner_id,unit_id);
create index if not exists portfolio_artifacts_learner_idx on public.portfolio_artifacts(learner_id);
create index if not exists portfolio_evidence_learner_idx on public.portfolio_evidence(learner_id);

create or replace function private.ac_school_member(
  p_school_id uuid,
  p_user_id uuid default auth.uid()
) returns boolean
language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.school_memberships sm
    where sm.school_id=p_school_id and sm.user_id=p_user_id
  );
$$;

create or replace function private.ac_school_role(
  p_school_id uuid,
  p_roles text[],
  p_user_id uuid default (select auth.uid())
) returns boolean
language sql stable security definer set search_path=''
as $$
  select exists (
    select 1 from public.school_memberships sm
    where sm.school_id=p_school_id
      and sm.user_id=p_user_id
      and sm.role=any(p_roles)
  );
$$;

create or replace function private.ac_learner_in_scope(
  p_learner_id uuid,
  p_user_id uuid default (select auth.uid())
) returns boolean
language sql stable security definer set search_path=''
as $$
  select exists (
    select 1
    from public.cohort_enrolments ce
    join public.cohorts c on c.id=ce.cohort_id
    left join public.cohort_staff cs on cs.cohort_id=c.id and cs.user_id=p_user_id
    join public.school_memberships sm on sm.school_id=c.school_id and sm.user_id=p_user_id
    where ce.learner_id=p_learner_id
      and (cs.user_id is not null or sm.role in ('admin','facilitator','viewer'))
  );
$$;

revoke execute on function private.ac_school_member(uuid,uuid) from public;
revoke execute on function private.ac_school_role(uuid,text[],uuid) from public;
revoke execute on function private.ac_learner_in_scope(uuid,uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.ac_school_member(uuid,uuid) to authenticated;
grant execute on function private.ac_school_role(uuid,text[],uuid) to authenticated;
grant execute on function private.ac_learner_in_scope(uuid,uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.learner_profiles enable row level security;
alter table public.schools enable row level security;
alter table public.school_memberships enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_staff enable row level security;
alter table public.cohort_enrolments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.prompt_responses enable row level security;
alter table public.lesson_notes enable row level security;
alter table public.portfolio_artifacts enable row level security;
alter table public.portfolio_evidence enable row level security;

revoke all on public.profiles,public.learner_profiles,public.schools,public.school_memberships,
  public.cohorts,public.cohort_staff,public.cohort_enrolments,public.lesson_progress,
  public.prompt_responses,public.lesson_notes,public.portfolio_artifacts,public.portfolio_evidence
from anon;

grant select,insert,update on public.profiles,public.learner_profiles to authenticated;
grant select on public.schools,public.school_memberships,public.cohorts,public.cohort_staff,public.cohort_enrolments to authenticated;
grant select,insert,update on public.lesson_progress,public.prompt_responses,public.lesson_notes,public.portfolio_artifacts,public.portfolio_evidence to authenticated;

create policy "profiles self read" on public.profiles for select to authenticated using (id=(select auth.uid()));
create policy "profiles self insert" on public.profiles for insert to authenticated with check (id=(select auth.uid()));
create policy "profiles self update" on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));

create policy "learner profiles self read" on public.learner_profiles for select to authenticated using (id=(select auth.uid()));
create policy "learner profiles self insert" on public.learner_profiles for insert to authenticated with check (id=(select auth.uid()));
create policy "learner profiles self update" on public.learner_profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));

create policy "schools members read" on public.schools for select to authenticated using (private.ac_school_member(id));
create policy "school memberships own or same school" on public.school_memberships for select to authenticated using (user_id=(select auth.uid()) or private.ac_school_member(school_id));
create policy "cohorts scoped read" on public.cohorts for select to authenticated using (private.ac_school_member(school_id));
create policy "cohort staff scoped read" on public.cohort_staff for select to authenticated using (user_id=(select auth.uid()) or exists(select 1 from public.cohorts c where c.id=cohort_id and private.ac_school_member(c.school_id)));
create policy "cohort enrolments learner or staff read" on public.cohort_enrolments for select to authenticated using (learner_id=(select auth.uid()) or exists(select 1 from public.cohorts c where c.id=cohort_id and private.ac_school_member(c.school_id)));

create policy "lesson progress own or scoped read" on public.lesson_progress for select to authenticated using (learner_id=(select auth.uid()) or private.ac_learner_in_scope(learner_id));
create policy "lesson progress own insert" on public.lesson_progress for insert to authenticated with check (learner_id=(select auth.uid()));
create policy "lesson progress own update" on public.lesson_progress for update to authenticated using (learner_id=(select auth.uid())) with check (learner_id=(select auth.uid()));

create policy "prompt responses own or scoped read" on public.prompt_responses for select to authenticated using (learner_id=(select auth.uid()) or private.ac_learner_in_scope(learner_id));
create policy "prompt responses own insert" on public.prompt_responses for insert to authenticated with check (learner_id=(select auth.uid()));
create policy "prompt responses own update" on public.prompt_responses for update to authenticated using (learner_id=(select auth.uid())) with check (learner_id=(select auth.uid()));

create policy "lesson notes own or scoped read" on public.lesson_notes for select to authenticated using (learner_id=(select auth.uid()) or private.ac_learner_in_scope(learner_id));
create policy "lesson notes own insert" on public.lesson_notes for insert to authenticated with check (learner_id=(select auth.uid()));
create policy "lesson notes own update" on public.lesson_notes for update to authenticated using (learner_id=(select auth.uid())) with check (learner_id=(select auth.uid()));

create policy "portfolio artifacts own or scoped read" on public.portfolio_artifacts for select to authenticated using (learner_id=(select auth.uid()) or private.ac_learner_in_scope(learner_id));
create policy "portfolio artifacts own insert" on public.portfolio_artifacts for insert to authenticated with check (learner_id=(select auth.uid()));
create policy "portfolio artifacts own update" on public.portfolio_artifacts for update to authenticated using (learner_id=(select auth.uid())) with check (learner_id=(select auth.uid()));

create policy "portfolio evidence own or scoped read" on public.portfolio_evidence for select to authenticated using (learner_id=(select auth.uid()) or private.ac_learner_in_scope(learner_id));
create policy "portfolio evidence own insert" on public.portfolio_evidence for insert to authenticated with check (learner_id=(select auth.uid()));
create policy "portfolio evidence own update" on public.portfolio_evidence for update to authenticated using (learner_id=(select auth.uid())) with check (learner_id=(select auth.uid()));
