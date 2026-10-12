-- Run after the revised frontend is deployed. Earlier rollout migrations are
-- additive, allowing active old clients to keep saving until the release switches.
-- Stale clients retain local edits and receive a visible sync/reload error.
revoke insert,update,delete on public.prompt_responses,public.lesson_notes,public.lesson_progress,public.learner_profiles,public.account_preferences from authenticated;

-- Keep elevated implementation code out of the exposed API schema. Public
-- wrappers are invoker functions; private implementations validate the live
-- session and derive ownership from auth.uid(), never from client parameters.
alter function public.save_learning_changes(jsonb,text) set schema private;
alter function private.save_learning_changes(jsonb,text) rename to save_learning_changes_impl;
revoke all on function private.save_learning_changes_impl(jsonb,text) from public,anon;
grant execute on function private.save_learning_changes_impl(jsonb,text) to authenticated;
create function public.save_learning_changes(p_changes jsonb,p_opened_unit text default null) returns jsonb
language sql security invoker set search_path='' as $$ select private.save_learning_changes_impl(p_changes,p_opened_unit); $$;
revoke all on function public.save_learning_changes(jsonb,text) from public,anon;
grant execute on function public.save_learning_changes(jsonb,text) to authenticated;
alter function public.save_account_preferences(jsonb) set schema private;
alter function private.save_account_preferences(jsonb) rename to save_account_preferences_impl;
revoke all on function private.save_account_preferences_impl(jsonb) from public,anon;
grant execute on function private.save_account_preferences_impl(jsonb) to authenticated;
create function public.save_account_preferences(p_patch jsonb) returns public.account_preferences
language sql security invoker set search_path='' as $$ select private.save_account_preferences_impl(p_patch); $$;
revoke all on function public.save_account_preferences(jsonb) from public,anon;
grant execute on function public.save_account_preferences(jsonb) to authenticated;
