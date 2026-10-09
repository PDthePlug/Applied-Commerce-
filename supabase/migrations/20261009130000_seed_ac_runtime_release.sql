-- Register the runtime release declared in public/curriculum/release.json.
-- The runtime requires this row for both learner synchronization and facilitator data loading.
-- This records the declared runtime only; it does not claim the curriculum source is fingerprinted.
insert into public.curriculum_releases (
  release_key,
  source_release_key,
  runtime_format_version,
  compiler_version,
  schema_version,
  published_at,
  metadata
)
values (
  'ac-runtime-3',
  null,
  3,
  'governed-runtime',
  1,
  null,
  jsonb_build_object(
    'product', 'Applied Commerce',
    'curriculumSourceStatus', 'not-source-fingerprinted',
    'sourceReleaseKey', null,
    'releaseSchemaVersion', 1
  )
)
on conflict (release_key) do nothing;
