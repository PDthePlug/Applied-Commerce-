-- Repair profile rows for pre-existing Auth users created before the
-- on_auth_user_created profile trigger was introduced. Learning-state sync
-- writes learner_profiles, whose user_id references public.profiles(id).
-- This does not grant any learner, facilitator, institution or admin role.
insert into public.profiles (id, display_name, status)
select
  u.id,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), ''),
  'active'
from auth.users u
where coalesce(u.is_anonymous, false) = false
  and not exists (
    select 1
    from public.profiles p
    where p.id = u.id
  )
on conflict (id) do nothing;
