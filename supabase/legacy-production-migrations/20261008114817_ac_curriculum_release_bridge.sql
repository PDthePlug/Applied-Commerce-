-- Applied Commerce curriculum release and durable assessment bridge
-- Milestone 2. Extends the already-live AC schema; does not replace it.
create table if not exists public.curriculum_releases (
  id uuid primary key default gen_random_uuid(),
  release_key text not null unique,
  source_release_key text,
  runtime_format_version smallint not null default 3,
  compiler_version text not null,
  schema_version integer not null,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.lesson_progress add column if not exists curriculum_release_id uuid references public.curriculum_releases(id) on delete restrict;
alter table public.prompt_responses add column if not exists curriculum_release_id uuid references public.curriculum_releases(id) on delete restrict;
alter table public.lesson_notes add column if not exists curriculum_release_id uuid references public.curriculum_releases(id) on delete restrict;
alter table public.portfolio_artifacts add column if not exists curriculum_release_id uuid references public.curriculum_releases(id) on delete restrict;
alter table public.portfolio_evidence add column if not exists curriculum_release_id uuid references public.curriculum_releases(id) on delete restrict;

create unique index if not exists lesson_progress_release_unit_unique
  on public.lesson_progress(learner_id,curriculum_release_id,unit_id)
  where curriculum_release_id is not null;

create unique index if not exists prompt_responses_release_key_unique
  on public.prompt_responses(learner_id,curriculum_release_id,prompt_key)
  where curriculum_release_id is not null;

create index if not exists lesson_progress_release_idx
  on public.lesson_progress(curriculum_release_id,unit_id);

create index if not exists prompt_responses_release_idx
  on public.prompt_responses(curriculum_release_id,unit_id);

create table if not exists public.assessment_attempts (
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
  unique(learner_id,curriculum_release_id,unit_id,attempt_number)
);

create index if not exists assessment_attempts_learner_idx on public.assessment_attempts(learner_id);
create index if not exists assessment_attempts_release_unit_idx on public.assessment_attempts(curriculum_release_id,unit_id);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists audit_events_actor_idx on public.audit_events(actor_user_id);
create index if not exists audit_events_school_idx on public.audit_events(school_id);
create index if not exists audit_events_occurred_idx on public.audit_events(occurred_at desc);

alter table public.curriculum_releases enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.audit_events enable row level security;

grant select on public.curriculum_releases to authenticated;
grant select,insert,update on public.assessment_attempts to authenticated;

create policy "curriculum releases authenticated read"
  on public.curriculum_releases for select to authenticated using (true);

create policy "assessment attempts select"
  on public.assessment_attempts for select to authenticated
  using (learner_id=(select auth.uid()) or private.can_view_learner(learner_id));

create policy "assessment attempts insert own"
  on public.assessment_attempts for insert to authenticated
  with check (learner_id=(select auth.uid()));

create policy "assessment attempts update own"
  on public.assessment_attempts for update to authenticated
  using (learner_id=(select auth.uid()))
  with check (learner_id=(select auth.uid()));

revoke all on public.audit_events from anon,authenticated;
