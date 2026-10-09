-- Applied Commerce RLS/performance hardening
create policy "learner profiles insert own"
  on public.learner_profiles for insert to authenticated
  with check ((select auth.uid())=user_id);

drop policy if exists "learner inserts own evidence" on public.evidence_records;
create policy "learner inserts own evidence"
  on public.evidence_records for insert to authenticated
  with check ((select auth.uid())=learner_id);

drop policy if exists "learner updates own evidence" on public.evidence_records;
create policy "learner updates own evidence"
  on public.evidence_records for update to authenticated
  using ((select auth.uid())=learner_id)
  with check ((select auth.uid())=learner_id);

create index if not exists evidence_report_snapshots_generated_by_idx on public.evidence_report_snapshots(generated_by);
create index if not exists evidence_reviews_reviewer_idx on public.evidence_reviews(reviewer_id);
create index if not exists evidence_reviews_rubric_idx on public.evidence_reviews(rubric_key);
create index if not exists lesson_notes_release_idx on public.lesson_notes(curriculum_release_id);
create index if not exists portfolio_artifacts_release_idx on public.portfolio_artifacts(curriculum_release_id);
create index if not exists portfolio_evidence_release_idx on public.portfolio_evidence(curriculum_release_id);
