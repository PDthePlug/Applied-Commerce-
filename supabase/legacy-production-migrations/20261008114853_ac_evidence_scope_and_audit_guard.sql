-- Applied Commerce evidence authorization hardening
-- Milestone 2. Uses the already-verified AC school/cohort authorization model.

create or replace function private.can_review_learner(target_learner uuid)
returns boolean
language sql stable security definer
set search_path=''
as $$
  select auth.uid() is not null and (
    exists (
      select 1
      from public.cohort_enrolments ce
      join public.cohort_staff cs on cs.cohort_id=ce.cohort_id
      where ce.learner_id=target_learner
        and ce.status='active'
        and cs.user_id=auth.uid()
        and cs.status='active'
    )
    or exists (
      select 1
      from public.cohort_enrolments ce
      join public.cohorts c on c.id=ce.cohort_id
      join public.school_memberships sm on sm.school_id=c.school_id
      where ce.learner_id=target_learner
        and ce.status='active'
        and sm.user_id=auth.uid()
        and sm.status='active'
        and sm.role in ('owner','admin')
    )
  );
$$;

revoke execute on function private.can_review_learner(uuid) from public;
grant execute on function private.can_review_learner(uuid) to authenticated;

drop policy if exists "learner reads own evidence" on public.evidence_records;
create policy "learner or assigned staff reads evidence"
  on public.evidence_records for select to authenticated
  using (learner_id=(select auth.uid()) or private.can_review_learner(learner_id));

drop policy if exists "review participants read reviews" on public.evidence_reviews;
create policy "learner or assigned staff reads reviews"
  on public.evidence_reviews for select to authenticated
  using (
    reviewer_id=(select auth.uid())
    or exists (
      select 1 from public.evidence_records er
      where er.id=evidence_reviews.evidence_record_id
        and (er.learner_id=(select auth.uid()) or private.can_review_learner(er.learner_id))
    )
  );

drop policy if exists "reviewer writes own review" on public.evidence_reviews;
create policy "assigned staff creates review"
  on public.evidence_reviews for insert to authenticated
  with check (
    reviewer_id=(select auth.uid())
    and exists (
      select 1 from public.evidence_records er
      where er.id=evidence_record_id
        and private.can_review_learner(er.learner_id)
    )
  );

drop policy if exists "reviewer updates own review" on public.evidence_reviews;
create policy "assigned staff updates review"
  on public.evidence_reviews for update to authenticated
  using (
    reviewer_id=(select auth.uid())
    and exists (
      select 1 from public.evidence_records er
      where er.id=evidence_record_id
        and private.can_review_learner(er.learner_id)
    )
  )
  with check (
    reviewer_id=(select auth.uid())
    and exists (
      select 1 from public.evidence_records er
      where er.id=evidence_record_id
        and private.can_review_learner(er.learner_id)
    )
  );

drop policy if exists "learner reads own report snapshots" on public.evidence_report_snapshots;
create policy "learner or assigned staff reads report snapshots"
  on public.evidence_report_snapshots for select to authenticated
  using (
    learner_id=(select auth.uid())
    or (learner_id is not null and private.can_review_learner(learner_id))
  );

create policy "audit events deny client access"
  on public.audit_events for all to authenticated
  using (false)
  with check (false);
