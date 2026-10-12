import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const source = fs.readFileSync('app/api/health/route.ts', 'utf8');
const { GET } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
test('health is read-only, uncached and does not expose keys or upstream bodies', async () => {
  const names = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE', 'VERCEL_GIT_COMMIT_SHA'];
  const saved = Object.fromEntries(names.map(name => [name, process.env[name]]));
  const original = globalThis.fetch;
  const calls = [];
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefghijklmnopqrst.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_private-test-value';
  delete process.env.NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE;
  process.env.VERCEL_GIT_COMMIT_SHA = 'verified-release';
  let failed = false, denied = false;
  globalThis.fetch = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes('/rest/')) return Response.json(failed ? { message: 'provider-detail-that-must-not-escape' } : denied ? { code: '42501', message: 'permission denied' } : [], { status: failed ? 503 : denied ? 401 : 200 });
    return new Response('provider-detail-that-must-not-escape', { status: failed ? 503 : 200 });
  };
  try {
    const healthy = await GET();
    assert.equal(healthy.status, 200);
    assert.equal(healthy.headers.get('cache-control'), 'no-store, max-age=0');
    assert.deepEqual(await healthy.json(), { status: 'ok', projectRef: 'abcdefghijklmnopqrst', commit: 'verified-release', dependencies: { auth: true, dataAPI: true } });
    assert.equal(calls.length, 2);
    assert.ok(calls.some(call => call.url.endsWith('/rest/v1/curriculum_releases?select=id&limit=0')));
    assert.ok(calls.every(call => !call.options.method && call.options.redirect === 'error' && call.options.cache === 'no-store'));
    denied = true;
    assert.equal((await GET()).status, 200, 'Expected database privilege denial proves connectivity without granting access');
    failed = true;
    const unavailable = await GET();
    assert.equal(unavailable.status, 503);
    assert.ok(!(await unavailable.text()).includes('provider-detail'));
    globalThis.fetch = async () => { throw new Error('secret connection information'); };
    assert.equal((await GET()).status, 503);
    process.env.NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE = 'local';
    assert.equal((await GET()).status, 503);
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    assert.equal((await GET()).status, 503);
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://user:password@evil.invalid';
    assert.equal((await (await GET()).json()).projectRef, null);
  } finally {
    globalThis.fetch = original;
    for (const name of names) if (saved[name] === undefined) delete process.env[name]; else process.env[name] = saved[name];
  }
});
