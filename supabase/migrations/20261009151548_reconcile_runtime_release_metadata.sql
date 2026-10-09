-- Reconcile the runtime release metadata with the manifest used by the application.
-- This is configuration, not learner-generated data; keep it available on a clean install.
update public.curriculum_releases
set metadata = coalesce(metadata, '{}'::jsonb)
  || jsonb_build_object(
    'product', 'Applied Commerce',
    'releaseManifest', 'public/curriculum/release.json',
    'sourceReleaseKey', null,
    'releaseSchemaVersion', 1,
    'curriculumSourceStatus', 'not-source-fingerprinted'
  )
where release_key = 'ac-runtime-3';

-- Fail visibly if the expected runtime release is absent instead of silently
-- leaving learner synchronization and facilitator data loading unconfigured.
do $$
begin
  if not exists (
    select 1 from public.curriculum_releases
    where release_key = 'ac-runtime-3'
      and metadata ->> 'releaseManifest' = 'public/curriculum/release.json'
      and metadata ->> 'curriculumSourceStatus' = 'not-source-fingerprinted'
  ) then
    raise exception 'AC runtime release metadata reconciliation failed';
  end if;
end;
$$;
