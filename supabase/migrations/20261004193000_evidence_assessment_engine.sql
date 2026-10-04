-- Applied Commerce Evidence & Assessment Engine
-- Prepared 2026-10-04. Apply to the dedicated Applied Commerce Production project
-- after it is reactivated and the existing core schema has been re-inspected.

create extension if not exists pgcrypto;

create table if not exists public.evidence_definitions (
  id uuid primary key default gen_random_uuid(),
  curriculum_key text not null unique,
  grade smallint not null check (grade between 8 and 12),
  term smallint not null check (term between 1 and 4),
  lesson_number integer,
  unit_id text not null,
  unit_title text not null,
  prompt_id text not null,
  slot text not null,
  prompt_text text not null,
  development_stage text not null check (development_stage in ('self-awareness','agency','strategy','architecture','adult-execution')),
  evidence_kind text not null,
  domains text[] not null default '{}',
  assessment_mode text not null check (assessment_mode in ('rubric','verification','deterministic','unscored')),
  rubric_key text,
  portfolio_eligible boolean not null default false,
  deterministic_rule jsonb not null default '{"kind":"presence"}'::jsonb,
  version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rubric_templates (
  key text primary key,
  name text not null,
  purpose text not null,
  version integer not null default 1,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.rubric_criteria (
  id uuid primary key default gen_random_uuid(),
  rubric_key text not null references public.rubric_templates(key) on delete cascade,
  criterion_key text not null,
  label text not null,
  description text not null,
  weight numeric(8,4) not null default 1,
  levels jsonb not null,
  position integer not null default 0,
  unique(rubric_key,criterion_key)
);

create table if not exists public.evidence_records (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references auth.users(id) on delete cascade,
  definition_id uuid references public.evidence_definitions(id) on delete set null,
  response_key text not null,
  response_value text not null,
  auto_result jsonb not null default '{}'::jsonb,
  status text not null default 'captured' check (status in ('captured','in-review','accepted','needs-revision','verified')),
  captured_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(learner_id,response_key)
);

create table if not exists public.evidence_reviews (
  id uuid primary key default gen_random_uuid(),
  evidence_record_id uuid not null references public.evidence_records(id) on delete cascade,
  reviewer_id uuid not null references auth.users(id) on delete restrict,
  rubric_key text references public.rubric_templates(key) on delete set null,
  status text not null check (status in ('pending','accepted','needs-revision','verified')),
  criteria_scores jsonb not null default '{}'::jsonb,
  feedback text not null default '',
  reviewed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(evidence_record_id,reviewer_id)
);

create table if not exists public.evidence_report_snapshots (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references auth.users(id) on delete cascade,
  generated_by uuid references auth.users(id) on delete set null,
  report_type text not null default 'learner-evidence',
  period jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  narrative jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now()
);

create index if not exists evidence_definitions_grade_term_idx on public.evidence_definitions(grade,term);
create index if not exists evidence_records_learner_updated_idx on public.evidence_records(learner_id,updated_at desc);
create index if not exists evidence_records_definition_idx on public.evidence_records(definition_id);
create index if not exists evidence_reviews_record_idx on public.evidence_reviews(evidence_record_id);
create index if not exists evidence_report_snapshots_learner_idx on public.evidence_report_snapshots(learner_id,generated_at desc);

alter table public.evidence_definitions enable row level security;
alter table public.rubric_templates enable row level security;
alter table public.rubric_criteria enable row level security;
alter table public.evidence_records enable row level security;
alter table public.evidence_reviews enable row level security;
alter table public.evidence_report_snapshots enable row level security;

grant select on public.evidence_definitions, public.rubric_templates, public.rubric_criteria to authenticated;
grant select,insert,update on public.evidence_records to authenticated;
grant select,insert,update on public.evidence_reviews to authenticated;
grant select on public.evidence_report_snapshots to authenticated;

drop policy if exists "authenticated reads evidence definitions" on public.evidence_definitions;
create policy "authenticated reads evidence definitions" on public.evidence_definitions for select to authenticated using (active);

drop policy if exists "authenticated reads rubric templates" on public.rubric_templates;
create policy "authenticated reads rubric templates" on public.rubric_templates for select to authenticated using (active);

drop policy if exists "authenticated reads rubric criteria" on public.rubric_criteria;
create policy "authenticated reads rubric criteria" on public.rubric_criteria for select to authenticated using (true);

drop policy if exists "learner reads own evidence" on public.evidence_records;
create policy "learner reads own evidence" on public.evidence_records for select to authenticated using (learner_id=auth.uid());

drop policy if exists "learner inserts own evidence" on public.evidence_records;
create policy "learner inserts own evidence" on public.evidence_records for insert to authenticated with check (learner_id=auth.uid());

drop policy if exists "learner updates own evidence" on public.evidence_records;
create policy "learner updates own evidence" on public.evidence_records for update to authenticated using (learner_id=auth.uid()) with check (learner_id=auth.uid());

drop policy if exists "review participants read reviews" on public.evidence_reviews;
create policy "review participants read reviews" on public.evidence_reviews for select to authenticated using (
  reviewer_id=auth.uid() or exists (
    select 1 from public.evidence_records er
    where er.id=evidence_reviews.evidence_record_id and er.learner_id=auth.uid()
  )
);

drop policy if exists "reviewer writes own review" on public.evidence_reviews;
create policy "reviewer writes own review" on public.evidence_reviews for insert to authenticated with check (reviewer_id=auth.uid());

drop policy if exists "reviewer updates own review" on public.evidence_reviews;
create policy "reviewer updates own review" on public.evidence_reviews for update to authenticated using (reviewer_id=auth.uid()) with check (reviewer_id=auth.uid());

drop policy if exists "learner reads own report snapshots" on public.evidence_report_snapshots;
create policy "learner reads own report snapshots" on public.evidence_report_snapshots for select to authenticated using (learner_id=auth.uid());

insert into public.rubric_templates(key,name,purpose) values
  ('analysis-v1','Analysis and reasoning','Checkpoints and analytical responses where the learner explains, compares, connects or justifies.'),
  ('reflection-v1','Reflection and learning','Reflections where the learner makes meaning from an experience, decision or change in thinking.'),
  ('action-v1','Action and real-world evidence','Interviews, observations, behavioural experiments and launch tasks.'),
  ('project-v1','Project evidence','Projects, maps, plans, presentations and multi-step portfolio work.')
on conflict (key) do update set name=excluded.name,purpose=excluded.purpose,active=true;
