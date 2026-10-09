# Archived Applied Commerce migrations

These files preserve the earlier production-oriented migration sources and the superseded draft migration filenames for traceability. **Do not run files in this directory through Supabase CLI and do not copy them back into `supabase/migrations/`.**

The active `supabase/migrations/` chain is now the exact sequence recorded by the verified AC staging project, reconstructed from the migration statements stored in `supabase_migrations.schema_migrations`, followed by forward-only hardening migrations. The old production project has a different historical migration ledger, including two missing source files and version/name mismatches; it is not the canonical target for future migration replay.

The first active migration is a data-free schema baseline. It creates schema objects, functions, triggers, policies, and grants; it does not copy Auth users, school/cohort test fixtures, learning responses, progress, or other application rows. The original source SQL for the earliest production migrations was not recoverable byte-for-byte, so the baseline is an explicit catalog reconstruction, not a claim that the original files were recovered.

Before production cutover:

- Apply and verify all pending forward migrations on staging.
- Confirm the final active migration list matches the staging ledger plus intentionally pending migrations.
- Keep the first platform-admin bootstrap as a controlled operational step; do not seed a test identity through migration DML.
- Confirm the production Vercel project points at the chosen canonical Supabase URL and publishable key before retiring the old project.
- Do not delete test Auth users or fixtures until the bootstrap account and rollback path are verified.
