-- Allow signed-in learners to create their own learner profile row.
grant select, insert, update on public.learner_profiles to authenticated;
