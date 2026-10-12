// Minimal synthetic Auth schema for disposable PostgreSQL drills only.
// Does not represent the Supabase Auth server or email delivery.
export const AUTH_FIXTURE_SQL = `create role anon; create role authenticated; create role service_role bypassrls;
 create schema auth; grant usage on schema auth,public to anon,authenticated,service_role;
 create table auth.users(id uuid primary key,email text,is_anonymous boolean default false,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz,deleted_at timestamptz,banned_until timestamptz);
 create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),not_after timestamptz);
 create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
 grant execute on function auth.jwt() to authenticated;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant execute on function auth.uid() to anon,authenticated,service_role;`;
