import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = new URL("../supabase/migrations/20261008213500_platform_superuser_authorization.sql", import.meta.url);

test("platform-admin migration replay preserves disabled account state", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /on conflict\s*\(user_id\)\s*do nothing/i);
  assert.doesNotMatch(sql, /on conflict\s*\(user_id\)\s*do update set status\s*=\s*'active'/i);
});

test("platform-admin bootstrap fails closed on an unresolved operating-role conflict", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const start = sql.indexOf("do $$", sql.indexOf("create or replace function private.create_school_impl"));
  const end = sql.indexOf("-- Create the requested AC platform institution", start);
  assert.ok(start >= 0 && end > start, "bootstrap preflight section must exist");
  const bootstrap = sql.slice(start, end);
  assert.match(bootstrap, /learner_profiles/i);
  assert.match(bootstrap, /school_memberships/i);
  assert.match(bootstrap, /cohort_staff/i);
  assert.match(bootstrap, /raise exception/i);
  assert.doesNotMatch(bootstrap, /delete\s+from\s+public\.learner_profiles/i);
});

test("private platform-admin registry has defense-in-depth RLS", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /alter table private\.platform_admins enable row level security/i);
  assert.match(sql, /revoke all on table private\.platform_admins from public, anon, authenticated/i);
});
