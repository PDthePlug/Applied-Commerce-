import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {stripTypeScriptTypes} from 'node:module';
let code=null,error=null;
globalThis.__callbackClient=async()=>({auth:{exchangeCodeForSession:async value=>{code=value;return {error};}}});
const source=fs.readFileSync('app/auth/callback/route.ts','utf8').replace(/^import .*;\n/gm,'');
const {GET}=await import('data:text/javascript;base64,'+Buffer.from('const createClient=globalThis.__callbackClient;\n'+stripTypeScriptTypes(source)).toString('base64'));
test('auth callback exchanges the code and uses an allowed internal reset destination',async()=>{code=null;error=null;const r=await GET(new Request('https://ac.invalid/auth/callback?code=abc&next=/auth/reset'));assert.equal(code,'abc');assert.equal(r.status,303);assert.equal(r.headers.get('location'),'https://ac.invalid/auth/reset');});
test('auth callback rejects external redirect targets',async()=>{error=null;const r=await GET(new Request('https://ac.invalid/auth/callback?code=abc&next=https://evil.invalid'));assert.equal(r.headers.get('location'),'https://ac.invalid/auth');});
test('expired or absent codes return to account access with a recovery indicator',async()=>{error=new Error('expired');const r=await GET(new Request('https://ac.invalid/auth/callback?code=expired'));assert.equal(r.headers.get('location'),'https://ac.invalid/auth?link=expired');assert.equal((await GET(new Request('https://ac.invalid/auth/callback'))).headers.get('location'),'https://ac.invalid/auth?link=expired');});
