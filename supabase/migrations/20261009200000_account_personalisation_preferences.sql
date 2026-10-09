-- Account-scoped presentation settings. These values affect the interface only;
-- they do not alter learner evidence, grades, curriculum records or staff roles.
create table if not exists public.account_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  appearance text not null default 'system',
  accent text not null default 'commerce',
  text_size text not null default 'standard',
  reading_width text not null default 'standard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_preferences_appearance_check check (appearance in ('system','light','warm','dark')),
  constraint account_preferences_accent_check check (accent in ('commerce','blue','amber','sage')),
  constraint account_preferences_text_size_check check (text_size in ('small','standard','large','extra_large')),
  constraint account_preferences_reading_width_check check (reading_width in ('narrow','standard','wide'))
);

alter table public.account_preferences enable row level security;
revoke all on table public.account_preferences from public, anon;
grant select, insert, update on table public.account_preferences to authenticated;

drop policy if exists account_preferences_select_own on public.account_preferences;
create policy account_preferences_select_own
  on public.account_preferences for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists account_preferences_insert_own on public.account_preferences;
create policy account_preferences_insert_own
  on public.account_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists account_preferences_update_own on public.account_preferences;
create policy account_preferences_update_own
  on public.account_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

comment on table public.account_preferences is
  'Private, account-owned Applied Commerce interface preferences; never learner evidence or role assignment.';
comment on column public.account_preferences.appearance is 'Account-selected interface appearance only.';
comment on column public.account_preferences.accent is 'Account-selected interface accent only.';
comment on column public.account_preferences.text_size is 'Account-selected reading text scale only.';
comment on column public.account_preferences.reading_width is 'Account-selected reading width only.';
