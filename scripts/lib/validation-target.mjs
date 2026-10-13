import fs from 'node:fs';
import assert from 'node:assert/strict';

export const PRODUCTION_REF = 'upvbxplswxhoqzbvgdxv';
export const ZIMBABWE_REF = 'hkarxzjmttjetotduvyx';

export function validateTarget(config, { allowProduction = false } = {}) {
  assert.match(config.projectRef ?? '', /^[a-z]{20}$/, 'An explicit projectRef is required');
  const url = new URL(config.url);
  assert.equal(url.origin + '/', config.url.replace(/\/$/, '') + '/', 'Use a bare Supabase origin');
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, config.projectRef + '.supabase.co', 'Configuration projectRef and URL differ');
  assert.equal(url.port, '');
  assert.equal(url.username + url.password, '');
  assert.notEqual(config.projectRef, ZIMBABWE_REF, 'Zimbabwe is outside the South African validation scope');
  if (!allowProduction) assert.notEqual(config.projectRef, PRODUCTION_REF, 'Isolated staging required; production testing must be explicitly enabled');
  assert.equal(typeof config.key, 'string', 'Public API key required');
  if (!config.key.startsWith('sb_publishable_')) {
    let claims;
    try { claims = JSON.parse(Buffer.from(config.key.split('.')[1], 'base64url')); } catch { /* Fail closed below. */ }
    assert.equal(claims?.role, 'anon', 'Only public API keys are permitted');
    assert.equal(claims?.ref, config.projectRef, 'Legacy public key belongs to another project');
  }
  return config;
}

export function loadRoleFixtures(directory) {
  assert.ok(directory, 'Set AC_ROLE_FIXTURES to a private fixture directory');
  const config = validateTarget(JSON.parse(fs.readFileSync(directory + '/public-config.json')), { allowProduction: process.env.AC_ALLOW_PRODUCTION_ROLE_TESTS === '1' });
  const fixtures = JSON.parse(fs.readFileSync(directory + '/fixtures.json'));
  assert.equal(fixtures.projectRef, config.projectRef, 'Fixtures must name the same projectRef');
  assert.match(fixtures.run ?? '', /^audit-[a-z0-9-]+$/);
  const roles = ['learner', 'other', 'facilitator', 'unassigned', 'schoolAdmin', 'platformAdmin'];
  assert.deepEqual(Object.keys(fixtures.users ?? {}).sort(), [...roles].sort(), 'Exactly the six dedicated fixture roles are required');
  const extra = fixtures.reportingLearners ?? [];
  assert.ok(Array.isArray(extra), 'Reporting fixtures must be an array');
  if (extra.length) assert.equal(extra.length, 5, 'Exactly five dedicated reporting learners are required');
  const accounts = [...roles.map(name => fixtures.users[name]), ...extra];
  for (const user of accounts) {
    assert.match(user?.id ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    assert.ok(user?.email?.startsWith(fixtures.run + '-'), 'Dedicated audit accounts required');
    assert.ok(user.email.endsWith('@example.invalid'), 'Dedicated fixture email domain required');
    assert.ok(typeof user.password === 'string' && user.password.length >= 8);
  }
  assert.equal(new Set(accounts.map(user => user.id)).size, accounts.length, 'Fixture identities must be distinct');
  return { config, fixtures };
}

export async function verifyHostedTarget(baseURL, config, expectedCommit) {
  const url = new URL(baseURL);
  assert.equal(url.origin, baseURL.replace(/\/$/, ''), 'Use a bare application origin');
  assert.equal(url.username + url.password, '');
  assert.ok(url.protocol === 'https:' || (url.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(url.hostname)), 'HTTPS required for hosted validation');
  const response = await fetch(new URL('/api/health', url), { redirect: 'error', signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, 'Application health probe failed; do not continue role tests');
  const health = await response.json();
  assert.equal(health.status, 'ok');
  assert.equal(health.projectRef, config.projectRef, 'Hosted build uses a different database');
  if (expectedCommit) assert.equal(health.commit, expectedCommit, 'Hosted commit differs from the requested release');
  return health;
}
