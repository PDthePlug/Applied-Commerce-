import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const legacyMigrationPath = new URL("../supabase/legacy-production-migrations/20261008213500_platform_superuser_authorization.sql", import.meta.url);
const baselinePath = new URL("../supabase/migrations/20261009071512_verified_production_schema_baseline_20261009.sql", import.meta.url);
const denyPolicyPath = new URL("../supabase/migrations/20261009071811_staging_platform_admin_registry_deny_clients.sql", import.meta.url);
const aclHardeningPath = new URL("../supabase/migrations/20261009151609_revoke_excessive_client_table_privileges.sql", import.meta.url);
const bootstrapRunbookPath = new URL("../docs/ac-platform-admin-bootstrap.md", import.meta.url);

test("archived platform-admin migration preserves disabled account state", async () => {
  const sql = await readFile(legacyMigrationPath, "utf8");
  assert.match(sql, /on conflict\s*\(user_id\)\s*do nothing/i);
  assert.doesNotMatch(sql, /on conflict\s*\(user_id\)\s*do update set status\s*=\s*'active'/i);
});

test("archived platform-admin migration retains the fail-closed role-conflict preflight", async () => {
  const sql = await readFile(legacyMigrationPath, "utf8");
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

test("canonical platform-admin registry has RLS and client-deny defense in depth", async () => {
  const baseline = await readFile(baselinePath, "utf8");
  const denyPolicy = await readFile(denyPolicyPath, "utf8");
  const hardening = await readFile(aclHardeningPath, "utf8");
  const runbook = await readFile(bootstrapRunbookPath, "utf8");
  assert.match(baseline, /alter table private\.platform_admins enable row level security/i);
  assert.match(denyPolicy, /create policy platform_admin_registry_deny_client_access/i);
  assert.match(denyPolicy, /using\s*\(false\)/i);
  assert.match(hardening, /revoke all privileges on all tables in schema private from public, anon/i);
  assert.match(runbook, /insert into private\.platform_admins/i);
  assert.match(runbook, /Do not insert rows directly into/i);
});
