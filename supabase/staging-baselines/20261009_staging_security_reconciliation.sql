-- Staging-only hardening for the private platform-admin registry.
-- RLS is enabled on private.platform_admins; no client identity may read or mutate this table.
create policy platform_admin_registry_deny_client_access
on private.platform_admins
as permissive
for all
to anon, authenticated
using (false)
with check (false);
