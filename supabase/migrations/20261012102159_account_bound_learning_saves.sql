-- Add this facade before the new frontend. The SDK reads its bearer token at
-- dispatch time, so a local getSession check cannot bind an in-flight save to
-- its originating account. Derive ownership in the existing save transaction,
-- and additionally reject any difference from the account that authored it.
create function public.save_learning_changes_for_account(p_account_id uuid,p_changes jsonb,p_opened_unit text default null)
returns jsonb language plpgsql security invoker set search_path='' as $$
begin
  if p_account_id is null or p_account_id is distinct from auth.uid() then
    raise insufficient_privilege using message='The active account changed; reload before saving';
  end if;
  return public.save_learning_changes(p_changes,p_opened_unit);
end; $$;
revoke all on function public.save_learning_changes_for_account(uuid,jsonb,text) from public,anon;
grant execute on function public.save_learning_changes_for_account(uuid,jsonb,text) to authenticated;
