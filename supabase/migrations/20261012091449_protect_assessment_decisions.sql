-- Preserve rows; protect staff-controlled decisions independently of row ownership.
-- Validate on an isolated project before release. Do not apply directly to production.
begin;

-- Seed the existing authored rubric contract (no new assessment criteria).
insert into public.rubric_templates(key,name,purpose) values('analysis-v1','Analysis and reasoning','For checkpoints and analytical responses where the learner must explain, compare, connect or justify.') on conflict(key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('analysis-v1','task-coverage','Addresses the task','Responds to the actual question and its required parts.',1,'[{"level":1,"label":"Beginning","description":"The response does not yet address the task."},{"level":2,"label":"Developing","description":"The response addresses some of the task but leaves important parts unresolved."},{"level":3,"label":"Secure","description":"The response addresses the required task clearly."},{"level":4,"label":"Strong","description":"The response addresses the full task with precision and useful detail."}]'::jsonb,0) on conflict(rubric_key,criterion_key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('analysis-v1','reasoning','Reasoning','Shows why the learner reached the conclusion.',1,'[{"level":1,"label":"Beginning","description":"A conclusion is given without supporting reasoning."},{"level":2,"label":"Developing","description":"Some reasoning is present but connections are limited."},{"level":3,"label":"Secure","description":"Reasoning is clear and supports the conclusion."},{"level":4,"label":"Strong","description":"Reasoning is well connected, considered and shows depth."}]'::jsonb,1) on conflict(rubric_key,criterion_key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('analysis-v1','application','Application','Connects the idea to a real example, system, decision or consequence.',1,'[{"level":1,"label":"Beginning","description":"No meaningful application is visible yet."},{"level":2,"label":"Developing","description":"An example or application is mentioned but not developed."},{"level":3,"label":"Secure","description":"The response applies the idea appropriately."},{"level":4,"label":"Strong","description":"The response applies the idea thoughtfully and shows consequences or trade-offs."}]'::jsonb,2) on conflict(rubric_key,criterion_key) do nothing;
insert into public.rubric_templates(key,name,purpose) values('reflection-v1','Reflection and learning','For reflections where the learner is making meaning from an experience, decision or change in thinking.') on conflict(key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('reflection-v1','specificity','Specificity','Uses concrete detail rather than a generic statement.',1,'[{"level":1,"label":"Beginning","description":"The reflection is too general to show what happened."},{"level":2,"label":"Developing","description":"Some specific detail is present."},{"level":3,"label":"Secure","description":"The reflection identifies a clear experience, thought or example."},{"level":4,"label":"Strong","description":"The reflection uses precise detail that makes the learning visible."}]'::jsonb,0) on conflict(rubric_key,criterion_key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('reflection-v1','insight','Insight','Explains what the learner noticed, understood or reconsidered.',1,'[{"level":1,"label":"Beginning","description":"The response describes without identifying learning."},{"level":2,"label":"Developing","description":"A learning point is present but lightly explained."},{"level":3,"label":"Secure","description":"The learner explains a meaningful insight."},{"level":4,"label":"Strong","description":"The learner shows a deeper shift, tension or connection in their thinking."}]'::jsonb,1) on conflict(rubric_key,criterion_key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('reflection-v1','next-step','Next step','Identifies what the learner will do, test or pay attention to next where relevant.',1,'[{"level":1,"label":"Beginning","description":"No next step is visible where one is required."},{"level":2,"label":"Developing","description":"A broad intention is stated."},{"level":3,"label":"Secure","description":"A practical next step is identified."},{"level":4,"label":"Strong","description":"The next step is specific, realistic and clearly linked to the reflection."}]'::jsonb,2) on conflict(rubric_key,criterion_key) do nothing;
insert into public.rubric_templates(key,name,purpose) values('action-v1','Action and real-world evidence','For interviews, observations, behavioural experiments and launch tasks.') on conflict(key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('action-v1','action-evidence','Evidence of action','Shows that the learner actually carried out the required action.',1,'[{"level":1,"label":"Beginning","description":"There is not yet enough evidence that the action happened."},{"level":2,"label":"Developing","description":"The action is described but supporting detail is limited."},{"level":3,"label":"Secure","description":"The response provides credible evidence that the action was completed."},{"level":4,"label":"Strong","description":"The evidence is specific, traceable and clearly connected to the task."}]'::jsonb,0) on conflict(rubric_key,criterion_key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('action-v1','observation','Observation','Records what happened rather than only what the learner expected.',1,'[{"level":1,"label":"Beginning","description":"The response does not yet record what happened."},{"level":2,"label":"Developing","description":"Some result or observation is recorded."},{"level":3,"label":"Secure","description":"The learner records the relevant result clearly."},{"level":4,"label":"Strong","description":"The learner notices important detail, differences or unintended outcomes."}]'::jsonb,1) on conflict(rubric_key,criterion_key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('action-v1','learning','Learning from action','Explains what the learner learned from doing the task.',1,'[{"level":1,"label":"Beginning","description":"No learning is identified yet."},{"level":2,"label":"Developing","description":"A learning point is stated but not developed."},{"level":3,"label":"Secure","description":"The learner explains what the action taught them."},{"level":4,"label":"Strong","description":"The learner connects the action to a broader decision, system or future behaviour."}]'::jsonb,2) on conflict(rubric_key,criterion_key) do nothing;
insert into public.rubric_templates(key,name,purpose) values('project-v1','Project evidence','For projects, maps, plans, presentations and multi-step portfolio work.') on conflict(key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('project-v1','completeness','Completeness','Includes the required elements of the project.',1,'[{"level":1,"label":"Beginning","description":"Major required elements are missing."},{"level":2,"label":"Developing","description":"The project is partially complete."},{"level":3,"label":"Secure","description":"The required elements are present."},{"level":4,"label":"Strong","description":"The project is complete, coherent and carefully developed."}]'::jsonb,0) on conflict(rubric_key,criterion_key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('project-v1','application','Application','Uses the curriculum idea in the project rather than only repeating theory.',1,'[{"level":1,"label":"Beginning","description":"The project does not yet apply the idea."},{"level":2,"label":"Developing","description":"Some application is visible."},{"level":3,"label":"Secure","description":"The project applies the idea appropriately."},{"level":4,"label":"Strong","description":"The application is thoughtful, contextual and shows trade-offs or consequences."}]'::jsonb,1) on conflict(rubric_key,criterion_key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('project-v1','evidence','Use of evidence','Uses observations, information, calculations or artefacts appropriately.',1,'[{"level":1,"label":"Beginning","description":"Evidence is absent or unrelated."},{"level":2,"label":"Developing","description":"Some relevant evidence is included."},{"level":3,"label":"Secure","description":"Relevant evidence supports the work."},{"level":4,"label":"Strong","description":"Evidence is well selected, interpreted and strengthens the project."}]'::jsonb,2) on conflict(rubric_key,criterion_key) do nothing;
insert into public.rubric_criteria(rubric_key,criterion_key,label,description,weight,levels,position) values('project-v1','communication','Communication','Makes the learner''s thinking understandable to another person.',1,'[{"level":1,"label":"Beginning","description":"The work is difficult to follow."},{"level":2,"label":"Developing","description":"The main idea can be understood with some gaps."},{"level":3,"label":"Secure","description":"The work communicates its purpose and reasoning clearly."},{"level":4,"label":"Strong","description":"The work is clear, purposeful and communicates complex thinking effectively."}]'::jsonb,3) on conflict(rubric_key,criterion_key) do nothing;


create or replace function private.guard_evidence_decision()
returns trigger language plpgsql set search_path='' as $$
begin
  if current_user in ('anon','authenticated') then
    if tg_op='UPDATE' and (new.learner_id,new.response_key,new.definition_id) is distinct from (old.learner_id,old.response_key,old.definition_id) then
      raise insufficient_privilege using message='Evidence identity cannot be reassigned';
    end if;
    if not private.can_review_learner(new.learner_id) then
      if new.status not in ('captured','in-review') then
        raise insufficient_privilege using message='A facilitator must assign review decisions';
      end if;
      if tg_op='UPDATE' and old.status in ('accepted','verified','needs-revision') and new.response_value is not distinct from old.response_value then
        raise insufficient_privilege using message='Reviewed evidence requires a revised response';
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_evidence_decision() from public,anon,authenticated;
create trigger guard_evidence_decision before insert or update on public.evidence_records
for each row execute function private.guard_evidence_decision();

create or replace function private.guard_assessment_decision()
returns trigger language plpgsql set search_path='' as $$
begin
  if current_user in ('anon','authenticated') then
    if tg_op='UPDATE' and (new.learner_id,new.curriculum_release_id,new.unit_id,new.attempt_number) is distinct from (old.learner_id,old.curriculum_release_id,old.unit_id,old.attempt_number) then
      raise insufficient_privilege using message='Assessment identity cannot be reassigned';
    end if;
    if not private.can_review_learner(new.learner_id) then
      if new.status='reviewed' or new.score is not null or new.reviewed_at is not null or new.result<>'{}'::jsonb then
        raise insufficient_privilege using message='A facilitator must assign assessment results';
      end if;
      if tg_op='UPDATE' and old.status='reviewed' then
        raise insufficient_privilege using message='Reviewed attempts cannot be overwritten';
      end if;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.guard_assessment_decision() from public,anon,authenticated;
create trigger guard_assessment_decision before insert or update on public.assessment_attempts
for each row execute function private.guard_assessment_decision();

-- A review is tied to the exact answer seen by its reviewer. Existing history
-- remains unchanged and has no invented historical snapshot.
alter table public.evidence_reviews add column response_value_at_review text;

create or replace function private.capture_review_history()
returns trigger language plpgsql security definer set search_path='' as $$
declare v_evidence public.evidence_records;
begin
  if (select auth.uid()) is null or new.reviewer_id<>(select auth.uid()) then
    raise insufficient_privilege using message='Authenticated reviewer required';
  end if;
  select * into strict v_evidence from public.evidence_records where id=new.evidence_record_id for update;
  if not private.can_review_learner(v_evidence.learner_id) then
    raise insufficient_privilege using message='Learner is outside reviewer scope';
  end if;
  if exists(select 1 from public.evidence_reviews where evidence_record_id=new.evidence_record_id and reviewer_id<>new.reviewer_id) then
    raise insufficient_privilege using message='Evidence has already been reviewed by another facilitator';
  end if;
  -- The same check covers direct Data API review writes, not only the RPC.
  perform private.lock_review_response(v_evidence.learner_id,v_evidence.response_key,v_evidence.response_value);
  if tg_op='UPDATE' and (new.evidence_record_id,new.reviewer_id) is distinct from (old.evidence_record_id,old.reviewer_id) then
    raise insufficient_privilege using message='Review identity cannot be reassigned';
  end if;
  if jsonb_typeof(new.criteria_scores)<>'object' or exists (
    select 1 from jsonb_each(new.criteria_scores) e where e.value not in ('1'::jsonb,'2'::jsonb,'3'::jsonb,'4'::jsonb)
  ) then raise check_violation using message='Rubric scores must be integers from one to four'; end if;
  if new.status='needs-revision' and trim(new.feedback)='' then
    raise check_violation using message='Revision feedback is required';
  end if;
  if new.rubric_key is not null then
    if exists(select 1 from jsonb_object_keys(new.criteria_scores) k where not exists(
      select 1 from public.rubric_criteria rc where rc.rubric_key=new.rubric_key and rc.criterion_key=k
    )) then raise check_violation using message='Scores must use the authored rubric criteria'; end if;
    if new.status in ('accepted','verified') and exists(
      select 1 from public.rubric_criteria rc where rc.rubric_key=new.rubric_key and not new.criteria_scores ? rc.criterion_key
    ) then raise check_violation using message='Score every authored criterion before accepting'; end if;
  end if;
  new.response_value_at_review:=v_evidence.response_value;
  new.reviewed_at:=now(); new.updated_at:=now();
  return new;
end;
$$;
revoke all on function private.capture_review_history() from public,anon,authenticated;
create trigger capture_review_history before insert or update on public.evidence_reviews
for each row execute function private.capture_review_history();

-- AFTER triggers log only committed insert/update operations, never an
-- attempted INSERT that becomes ON CONFLICT UPDATE.
create or replace function private.record_review_history()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if (select auth.uid()) is null or new.reviewer_id<>(select auth.uid()) then
    raise insufficient_privilege using message='Authenticated reviewer required';
  end if;
  insert into public.audit_events(actor_user_id,event_type,entity_type,entity_id,metadata)
  values((select auth.uid()),'evidence.review_saved','evidence_review',new.id,
    jsonb_build_object('previous',case when tg_op='UPDATE' then to_jsonb(old) else null end,'current',to_jsonb(new)));
  update public.evidence_records set status=case when new.status='pending' then 'in-review' else new.status end,updated_at=now() where id=new.evidence_record_id;
  return new;
end;
$$;
revoke all on function private.record_review_history() from public,anon,authenticated;
create trigger record_review_history after insert or update on public.evidence_reviews
for each row execute function private.record_review_history();

-- One transaction: lock the canonical response, compare the reviewed answer,
-- store the evidence, then store the review. Any failure rolls everything back.
-- Staff have SELECT rather than UPDATE access to learner answers. Keep the
-- scoped lock in private code so taking a lock never grants answer-write access.
create or replace function private.lock_review_response(p_learner_id uuid,p_response_key text,p_response_value text)
returns void language plpgsql security definer set search_path='' as $$
declare v_response jsonb;
begin
  if (select auth.uid()) is null or not private.can_review_learner(p_learner_id) then
    raise insufficient_privilege using message='Authorized facilitator required';
  end if;
  select pr.response into v_response from public.prompt_responses pr
    join public.curriculum_releases cr on cr.id=pr.curriculum_release_id
    where pr.learner_id=p_learner_id and pr.prompt_key=p_response_key and cr.release_key='ac-runtime-3' for update of pr;
  if not found or jsonb_typeof(v_response)<>'string' or (v_response#>>'{}') is distinct from p_response_value then
    raise serialization_failure using message='The learner answer changed; reload it before reviewing';
  end if;
end;
$$;
revoke all on function private.lock_review_response(uuid,text,text) from public,anon;
grant execute on function private.lock_review_response(uuid,text,text) to authenticated;

create or replace function public.save_facilitator_review(
  p_learner_id uuid,p_response_key text,p_response_value text,p_auto_result jsonb,p_review jsonb
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_record uuid; v_review uuid; v_status text:=p_review->>'status'; v_actor uuid:=(select auth.uid());
begin
  if v_actor is null or not private.can_review_learner(p_learner_id) then
    raise insufficient_privilege using message='Authorized facilitator required';
  end if;
  if v_status not in ('pending','accepted','needs-revision','verified') or v_status is null then
    raise check_violation using message='Invalid review status';
  end if;
  perform private.lock_review_response(p_learner_id,p_response_key,p_response_value);
  v_record:=public.upsert_facilitator_evidence_record(p_learner_id,p_response_key,p_response_value,p_auto_result,
    case when v_status='pending' then 'in-review' else v_status end);
  insert into public.evidence_reviews(evidence_record_id,reviewer_id,rubric_key,status,criteria_scores,feedback,portfolio_interpretation,next_pathway)
    values(v_record,v_actor,p_review->>'rubricKey',v_status,coalesce(p_review->'criteria','{}'::jsonb),coalesce(p_review->>'feedback',''),coalesce(p_review->>'portfolioInterpretation',''),coalesce(p_review->>'nextPathway',''))
    on conflict(evidence_record_id,reviewer_id) do update set rubric_key=excluded.rubric_key,status=excluded.status,criteria_scores=excluded.criteria_scores,feedback=excluded.feedback,portfolio_interpretation=excluded.portfolio_interpretation,next_pathway=excluded.next_pathway
    returning id into v_review;
  return v_review;
end;
$$;
revoke all on function public.save_facilitator_review(uuid,text,text,jsonb,jsonb) from public,anon;
grant execute on function public.save_facilitator_review(uuid,text,text,jsonb,jsonb) to authenticated;
commit;
