# Applied Commerce platform-admin bootstrap runbook

This runbook is for a clean AC Supabase project after the canonical schema migrations have been applied. The migrations intentionally do not seed a named or test platform administrator.

## Procedure

1. In the Supabase Auth dashboard for the selected AC project, create or confirm the first trusted platform-administrator account through the supported Auth workflow. Do not insert rows directly into `auth.users`.
2. Copy that user's Auth UUID from the dashboard.
3. In the SQL editor for the same project, run the following as the database owner. Replace the placeholder with the exact Auth UUID; do not use an email supplied by a client.

```sql
insert into private.platform_admins (user_id, status, granted_by)
select id, 'active', null
from auth.users
where id = '<AUTH_USER_UUID>'::uuid
  and coalesce(is_anonymous, false) = false
on conflict (user_id) do update
set status = case
      when private.platform_admins.status = 'disabled' then 'disabled'
      else 'active'
    end,
    updated_at = now();

select pa.user_id, pa.status
from private.platform_admins pa
where pa.user_id = '<AUTH_USER_UUID>'::uuid;
```

4. Confirm the query returns exactly the intended account with `status = 'active'`. Do not disable the last known-good platform administrator until a replacement has been verified.
5. Keep this operation restricted to trusted project owners. Never expose `private.platform_admins` through the Data API or grant client access to it.

This is an operational bootstrap step, not learner data. It is intentionally separate from migration replay so that a clean schema does not inherit any of the old test accounts.
