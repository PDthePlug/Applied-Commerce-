// Uses an original, genuinely issued JWT. Never edits or signs claims, changes
// Auth tables, or calls a valid refreshed token an expired-session test.
import fs from 'node:fs';import assert from 'node:assert/strict';import {loadRoleFixtures}from './lib/validation-target.mjs';
process.umask(0o077);const dir=process.env.AC_ROLE_FIXTURES,{config,fixtures}=loadRoleFixtures(dir);assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const session=JSON.parse(fs.readFileSync(process.env.AC_EXPIRY_SESSION_FILE??dir+'/sessions.json')).learner;
const claims=JSON.parse(Buffer.from(session.access_token.split('.')[1],'base64url'));
assert.equal(claims.sub,fixtures.users.learner.id);assert.equal(claims.iss,config.url+'/auth/v1');assert.ok(Number.isFinite(claims.exp));
const secondsRemaining=claims.exp-Math.floor(Date.now()/1000);
// Allow a conservative observation delay rather than asserting at the first
// clock boundary. This is a test delay, not a claim about configured JWT grace.
const settlementSeconds=60;
const result={at:new Date().toISOString(),scope:'Genuine naturally expired original JWT; no refresh. Does not certify configured maximum/inactivity session lifetime or the server clock-tolerance setting.',status:'PENDING',secondsRemaining,settlementSeconds,checks:[]};
const save=()=>fs.writeFileSync(dir+'/expiry-results.json',JSON.stringify(result,null,2));
if(secondsRemaining>=-settlementSeconds){save();console.log(JSON.stringify(result));process.exitCode=2;}
else{try{for(const endpoint of ['/auth/v1/user','/rest/v1/prompt_responses?select=id&limit=1']){const r=await fetch(config.url+endpoint,{headers:{apikey:config.key,Authorization:'Bearer '+session.access_token},signal:AbortSignal.timeout(20000)});const body=await r.json();const expiryReason=/expir/i.test(JSON.stringify(body));result.checks.push({endpoint,status:r.status,expiryReason});save();assert.ok([401,403].includes(r.status)&&expiryReason,'Naturally expired token was not rejected for expiry');}result.status='PASS';save();console.log(JSON.stringify(result));}catch(error){result.status='FAIL';result.failureType=error.name;save();throw error;}}
