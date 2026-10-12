// No connection strings or remote database APIs are accepted. All identities
// and data are generated inside a disposable embedded PostgreSQL instance.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { AUTH_FIXTURE_SQL } from './lib/database-fixture.mjs';

const learners = Number(process.env.AC_DRILL_LEARNERS ?? 500);
assert.ok(Number.isInteger(learners) && learners >= 2 && learners <= 2000, 'Use 2–2000 synthetic learners');
const samples = 20, answersPerLearner = 20;
const uid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const learner = uid(1), other = uid(2), staff = uid(9001), outsider = uid(9002), admin = uid(9003);
const school = uid(9010), cohort = uid(9011);
const key = 'g8-t1-l01-001::prompt-drill::response';
const source = new PGlite({ extensions: { pgcrypto } });
let restored;
const checks = [], timings = {};
const mark = name => { checks.push({ name, status: 'PASS' }); console.log('PASS ' + name); };
const hash = value => createHash('sha256').update(value).digest('hex');
async function asUser(db, id, sql, params = []) {
  await db.exec('begin; set local role authenticated;');
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',json_build_object('session_id',$1)::text,true)", [id]);
    const result = await db.query(sql, params);
    await db.exec('commit');
    return result;
  } catch (error) { await db.exec('rollback'); throw error; }
}
async function snapshot(db) {
  const tables = (await db.query("select schemaname,tablename from pg_tables where schemaname in ('auth','public','private') order by schemaname,tablename")).rows;
  const rows = [];
  for (const table of tables) {
    const ident = name => '"' + name.replaceAll('"', '""') + '"';
    const digest = await db.query(`select count(*)::int as count, md5(coalesce(string_agg(to_jsonb(t)::text,E'\\n' order by to_jsonb(t)::text),'')) as digest from ${ident(table.schemaname)}.${ident(table.tablename)} t`);
    rows.push({ table: table.schemaname + '.' + table.tablename, ...digest.rows[0] });
  }
  const catalog = await db.query(`select n.nspname,c.relname,c.relrowsecurity,c.relacl::text from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','private') and c.relkind='r' order by 1,2`);
  const policies = await db.query("select * from pg_policies where schemaname in ('public','private') order by schemaname,tablename,policyname");
  const functions = await db.query("select n.nspname,p.proname,p.prosecdef,p.proacl::text,pg_get_functiondef(p.oid) as definition from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('public','private','auth') order by n.nspname,p.proname,p.oid");
  return { rows, catalogHash: hash(JSON.stringify([catalog.rows, policies.rows, functions.rows])) };
}
async function measure(name, work) {
  await work(); // Warm-up is excluded from the measured sample.
  const values = [];
  for (let i = 0; i < samples; i++) { const start = performance.now(); await work(i); values.push(performance.now() - start); }
  values.sort((a, b) => a - b);
  const round = n => Math.round(n * 100) / 100;
  timings[name] = { samples, p50Ms: round(values[Math.ceil(samples * .5) - 1]), p95Ms: round(values[Math.ceil(samples * .95) - 1]), maxMs: round(values.at(-1)) };
}
try {
  await source.exec(AUTH_FIXTURE_SQL);
  const migrations = fs.readdirSync('supabase/migrations').filter(file => file.endsWith('.sql')).sort();
  for (const file of migrations) await source.exec(fs.readFileSync('supabase/migrations/' + file, 'utf8'));
  mark('complete migration replay');
  const release = (await source.query("select id from public.curriculum_releases where release_key='ac-runtime-3'")).rows[0].id;
  await source.query("insert into auth.users(id,email) select ('00000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'audit-drill-'||n||'@example.invalid' from generate_series(1,$1) n", [learners]);
  for (const id of [staff, outsider, admin]) await source.query('insert into auth.users(id,email) values($1,$2)', [id, 'audit-drill-' + id + '@example.invalid']);
  await source.exec('insert into auth.sessions(id,user_id) select id,id from auth.users');
  await source.query('insert into private.platform_admins(user_id) values($1)', [admin]);
  await source.query("insert into public.schools(id,name,slug) values($1,'Synthetic operational drill','audit-operational-drill')", [school]);
  await source.query("insert into public.cohorts(id,school_id,name,grade,academic_year) values($1,$2,'Synthetic cohort',8,2026)", [cohort, school]);
  await source.query('insert into public.learner_profiles(user_id) select id from auth.users where id not in ($1,$2,$3)', [staff, outsider, admin]);
  await source.query('insert into public.cohort_enrolments(cohort_id,learner_id) select $1,user_id from public.learner_profiles', [cohort]);
  await source.query("insert into public.school_memberships(school_id,user_id,role) values($1,$2,'educator')", [school, staff]);
  await source.query('insert into public.cohort_staff(cohort_id,user_id) values($1,$2)', [cohort, staff]);
  await source.query(`insert into public.prompt_responses(learner_id,curriculum_release_id,curriculum_version,grade,term,unit_id,prompt_key,response)
    select user_id,$1,'ac-runtime-3',8,1,'g8-t1-l01-'||lpad(n::text,3,'0'),
    'g8-t1-l01-'||lpad(n::text,3,'0')||'::prompt-drill::response',to_jsonb('Synthetic answer '||n)
    from public.learner_profiles cross join generate_series(1,$2) n`, [release, answersPerLearner]);
  await asUser(source, learner, 'select public.save_learning_changes_for_account($1,$2)', [learner, JSON.stringify([{ kind: 'note', key: 'g8-t1-l01-001', value: 'Restore this synthetic note', expected: 0 }])]);
  await asUser(source, staff, 'select public.save_facilitator_review($1,$2,$3,$4,$5)', [learner, key, 'Synthetic answer 1', {}, { status: 'accepted', criteria: {}, feedback: 'Synthetic reviewed example' }]);
  mark('synthetic cohort, revision and review fixtures');
  await source.exec('analyze;');
  await measure('learnerAnswers', async () => {
    const result = await asUser(source, learner, 'select prompt_key,response,sync_revision from public.prompt_responses where learner_id=$1 order by prompt_key limit 1000', [learner]);
    assert.equal(result.rows.length, answersPerLearner);
  });
  await measure('facilitatorPage', async () => {
    const result = await asUser(source, staff, 'select id,learner_id,response from public.prompt_responses order by id limit 1000');
    assert.equal(result.rows.length, Math.min(1000, learners * answersPerLearner));
  });
  await measure('administratorCohort', async () => {
    const result = await asUser(source, admin, 'select learner_id from public.cohort_enrolments where cohort_id=$1 order by learner_id limit 1000', [cohort]);
    assert.equal(result.rows.length, Math.min(1000, learners));
  });
  let revision = 1;
  await measure('revisionSave', async i => {
    const result = await asUser(source, learner, 'select public.save_learning_changes_for_account($1,$2) as result', [learner, JSON.stringify([{ kind: 'note', key: 'g8-t1-l01-001', value: 'Synthetic measured save ' + (i ?? 'warmup'), expected: revision }])]);
    assert.equal(result.rows[0].result[0].conflict, false);
    revision = result.rows[0].result[0].revision;
  });
  mark('role-specific volume queries and revision saves');
  const before = await snapshot(source);
  assert.equal(before.rows.find(row => row.table === 'public.prompt_responses').count, learners * answersPerLearner);
  const startBackup = performance.now();
  const backup = await source.dumpDataDir();
  const backupBytes = Buffer.from(await backup.arrayBuffer());
  const backupMs = performance.now() - startBackup;
  // Deliberately change only the synthetic source after capturing the backup.
  await source.exec("update public.lesson_notes set note='Changed after backup';");
  const startRestore = performance.now();
  restored = new PGlite({ extensions: { pgcrypto }, loadDataDir: new Blob([backupBytes]) });
  await restored.waitReady;
  const restoreMs = performance.now() - startRestore;
  assert.deepEqual(await snapshot(restored), before);
  mark('physical restore preserves every table digest, RLS policy, grant and function');
  assert.equal((await asUser(restored, learner, 'select response from public.prompt_responses')).rows.length, answersPerLearner);
  assert.equal((await asUser(restored, other, 'select response from public.prompt_responses where learner_id=$1', [learner])).rows.length, 0);
  assert.equal((await asUser(restored, outsider, 'select response from public.prompt_responses where learner_id=$1', [learner])).rows.length, 0);
  assert.equal((await asUser(restored, staff, 'select status from public.evidence_records where learner_id=$1', [learner])).rows[0].status, 'accepted');
  await assert.rejects(asUser(restored, learner, 'update public.prompt_responses set response=$1', [JSON.stringify('bypass')]), /permission denied/);
  mark('restored learner isolation, assigned review and write enforcement');
  const saved = await asUser(restored, learner, 'select public.save_learning_changes_for_account($1,$2) as result', [learner, JSON.stringify([{ kind: 'note', key: 'g8-t1-l01-001', value: 'After restored save', expected: revision }])]);
  assert.equal(saved.rows[0].result[0].conflict, false);
  const conflict = await asUser(restored, learner, 'select public.save_learning_changes_for_account($1,$2) as result', [learner, JSON.stringify([{ kind: 'note', key: 'g8-t1-l01-001', value: 'Stale restored save', expected: revision }])]);
  assert.equal(conflict.rows[0].result[0].conflict, true);
  assert.equal(conflict.rows[0].result[0].value, 'After restored save');
  mark('restored save accepts current revision and rejects stale work');
  await restored.query('delete from auth.sessions where user_id=$1', [learner]);
  assert.equal((await asUser(restored, learner, 'select * from public.prompt_responses')).rows.length, 0);
  mark('restored session revocation removes private visibility');
  const result = { at: new Date().toISOString(), scope: 'synthetic embedded PostgreSQL; no hosted capacity or provider backup certification', postgres: (await source.query('select version() as version')).rows[0].version, learners, answers: learners * answersPerLearner, concurrency: 1, timings, backup: { bytes: backupBytes.length, sha256: hash(backupBytes), backupMs: Math.round(backupMs), restoreMs: Math.round(restoreMs), tablesVerified: before.rows.length }, migrations: migrations.map(file => ({ file, sha256: hash(fs.readFileSync('supabase/migrations/' + file)) })), checks };
  fs.mkdirSync('test-results', { recursive: true });
  fs.writeFileSync('test-results/operational-database-drill.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ passed: checks.length, failed: 0, learners, answers: result.answers, timings, backup: result.backup }));
} finally { await source.close(); if (restored) await restored.close(); }
