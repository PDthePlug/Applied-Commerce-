-- Make the private pending-assignment deny posture explicit and remove default
-- function execution grants from trigger-only helpers.
drop policy if exists pending_role_assignments_deny_client_access on private.pending_role_assignments;
create policy pending_role_assignments_deny_client_access
on private.pending_role_assignments
as permissive
for all
to anon, authenticated
using (false)
with check (false);

revoke all on table private.pending_role_assignments from anon, authenticated;
revoke execute on function private.guard_pending_role_assignment() from public, anon, authenticated;
revoke execute on function private.apply_pending_role_assignments_after_signup() from public, anon, authenticated;
