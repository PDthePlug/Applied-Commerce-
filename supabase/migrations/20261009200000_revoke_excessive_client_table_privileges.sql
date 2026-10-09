-- Tighten client table privileges and fail closed for future app objects.
-- RLS controls row access; it does not make TRUNCATE safe, and table-level
-- TRIGGER / REFERENCES grants are not needed by learner-facing clients.
revoke truncate, trigger, references on all tables in schema public
  from public, anon, authenticated;
revoke truncate, trigger, references on all tables in schema private
  from public, anon, authenticated;

-- Migrations run as postgres. Do not automatically grant broad table, sequence,
-- or function privileges to clients on objects created by future migrations.
-- Required access must be granted explicitly per object in its migration.
alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke all on tables from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke all on sequences from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;

do $$
begin
  if exists (
    select 1
    from information_schema.table_privileges
    where table_schema in ('public', 'private')
      and grantee in ('PUBLIC', 'anon', 'authenticated')
      and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
  ) then
    raise exception 'AC client roles retain excessive table privileges';
  end if;

  if exists (
    select 1
    from pg_default_acl d
    join pg_namespace n on n.oid = d.defaclnamespace
    cross join lateral aclexplode(d.defaclacl) a
    where n.nspname in ('public', 'private')
      and d.defaclrole = (select oid from pg_roles where rolname = 'postgres')
      and a.grantee in (
        0,
        (select oid from pg_roles where rolname = 'anon'),
        (select oid from pg_roles where rolname = 'authenticated')
      )
      and d.defaclobjtype in ('r', 'S', 'f')
  ) then
    raise exception 'AC postgres defaults still grant broad client privileges';
  end if;
end;
$$;
