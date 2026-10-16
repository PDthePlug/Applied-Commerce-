import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validateTarget, verifyHostedTarget, loadRoleFixtures, PRODUCTION_REF, ZIMBABWE_REF } from '../scripts/lib/validation-target.mjs';
const projectRef = 'abcdefghijklmnopqrst';
const target = (ref = projectRef) => ({ projectRef: ref, url: `https://${ref}.supabase.co`, key: 'sb_publishable_test' });
test('isolated validation accepts a matching public target', () => assert.equal(validateTarget(target()).projectRef, projectRef));
test('validation rejects production by default, Zimbabwe, and mismatched URL', () => {
  assert.throws(() => validateTarget(target(PRODUCTION_REF)), /Isolated/);
  assert.equal(validateTarget(target(PRODUCTION_REF), { allowProduction: true }).projectRef, PRODUCTION_REF);
  assert.throws(() => validateTarget(target(ZIMBABWE_REF), { allowProduction: true }), /Zimbabwe/);
  assert.throws(() => validateTarget({ ...target(), url: `https://${PRODUCTION_REF}.supabase.co` }), /differ/);
});
test('validation rejects secret and cross-project legacy keys', () => {
  assert.throws(() => validateTarget({ ...target(), key: 'sb_secret_private' }), /public API/);
  const jwt = claims => 'header.' + Buffer.from(JSON.stringify(claims)).toString('base64url') + '.signature';
  assert.throws(() => validateTarget({ ...target(), key: jwt({ role: 'service_role', ref: projectRef }) }), /public API/);
  assert.throws(() => validateTarget({ ...target(), key: jwt({ role: 'anon', ref: PRODUCTION_REF }) }), /another project/);
  validateTarget({ ...target(), key: jwt({ role: 'anon', ref: projectRef }) });
});
test('validation rejects URL credentials, query strings and insecure hosted origins', async () => {
  for (const url of [`https://user@${projectRef}.supabase.co`, `https://${projectRef}.supabase.co?key=abc`]) assert.throws(() => validateTarget({ ...target(), url }));
  await assert.rejects(verifyHostedTarget('http://example.com', target()), /HTTPS/);
});
test('hosted target fails closed on wrong project, wrong release or unavailable dependencies', async () => {
  const original = globalThis.fetch;
  let body = { status: 'ok', projectRef, commit: 'expected' }, status = 200;
  globalThis.fetch = async () => Response.json(body, { status });
  try {
    await verifyHostedTarget('https://app.invalid', target(), 'expected');
    await assert.rejects(verifyHostedTarget('https://app.invalid', target(), 'other'), /commit/);
    body = { ...body, projectRef: PRODUCTION_REF };
    await assert.rejects(verifyHostedTarget('https://app.invalid', target()), /different database/);
    status = 503;
    await assert.rejects(verifyHostedTarget('https://app.invalid', target()), /health probe/);
  } finally { globalThis.fetch = original; }
});
test('private fixture manifests require six distinct accounts in the same project', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ac-target-test-'));
  const roles = ['learner', 'other', 'facilitator', 'unassigned', 'schoolAdmin', 'platformAdmin'];
  const fixtures = { projectRef, run: 'audit-target-test', users: Object.fromEntries(roles.map((role, i) => [role, { id: '00000000-0000-4000-8000-' + String(i + 1).padStart(12, '0'), email: 'audit-target-test-' + role + '@example.invalid', password: 'synthetic-test-only' }])) };
  const write = () => fs.writeFileSync(directory + '/fixtures.json', JSON.stringify(fixtures));
  fs.writeFileSync(directory + '/public-config.json', JSON.stringify(target()));
  try {
    write(); loadRoleFixtures(directory);
    fixtures.projectRef = PRODUCTION_REF; write(); assert.throws(() => loadRoleFixtures(directory), /same projectRef/);
    fixtures.projectRef = projectRef; fixtures.users.other.id = fixtures.users.learner.id; write(); assert.throws(() => loadRoleFixtures(directory), /distinct/);
    delete fixtures.users.other; write(); assert.throws(() => loadRoleFixtures(directory), /six dedicated/);
  } finally { fs.rmSync(directory, { recursive: true }); }
});

test('reporting sessions require five distinct dedicated identities and reject real email accounts',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'ac-report-target-'));
 const run='audit-reporting-test';
 const identity=i=>({id:'00000000-0000-4000-8000-'+String(i).padStart(12,'0'),email:run+'-'+i+'@example.invalid',password:'synthetic-test-only'});
 const roles=['learner','other','facilitator','unassigned','schoolAdmin','platformAdmin'];
 const fixtures={projectRef,run,users:Object.fromEntries(roles.map((role,i)=>[role,identity(i+1)])),reportingLearners:Array.from({length:5},(_,i)=>identity(i+7))};
 const write=()=>fs.writeFileSync(directory+'/fixtures.json',JSON.stringify(fixtures));
 fs.writeFileSync(directory+'/public-config.json',JSON.stringify(target()));
 try{write();loadRoleFixtures(directory);fixtures.reportingLearners[0].id=fixtures.users.learner.id;write();assert.throws(()=>loadRoleFixtures(directory),/distinct/);fixtures.reportingLearners[0]=identity(7);fixtures.reportingLearners[0].email=run+'-7@real.invalid';write();assert.throws(()=>loadRoleFixtures(directory),/fixture email domain/);fixtures.reportingLearners.pop();write();assert.throws(()=>loadRoleFixtures(directory),/five dedicated/);}finally{fs.rmSync(directory,{recursive:true});}
});
