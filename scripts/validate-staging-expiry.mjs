// Uses an original, genuinely issued JWT. Never edits or signs claims, changes
// Auth tables, or calls a valid refreshed token an expired-session test.
import fs from 'node:fs';import assert from 'node:assert/strict';import {loadRoleFixtures}from './lib/validation-target.mjs';
process.umask(0o077);const dir=process.env.AC_ROLE_FIXTURES,{config}=loadRoleFixtures(dir);assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const session=JSON.parse(fs.readFileSync(dir+'/sessions.json')).learner;
const claims=JSON.parse(Buffer.from(session.access_token.split('.')[1],'base64url'));
const secondsRemaining=claims.exp-Math.floor(Date.now()/1000);
const result={scope:'Genuine naturally expired original JWT; no refresh. Does not certify configured maximum/inactivity session lifetime.',status:'PENDING',secondsRemaining};
if(secondsRemaining>=-5){fs.writeFileSync(dir+'/expiry-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));process.exitCode=2;}
else{const statuses=[];for(const endpoint of ['/auth/v1/user','/rest/v1/prompt_responses?select=id&limit=1']){const r=await fetch(config.url+endpoint,{headers:{apikey:config.key,Authorization:'Bearer '+session.access_token},signal:AbortSignal.timeout(20000)});statuses.push(r.status);assert.equal(r.status,401,'Naturally expired token was not rejected');}result.status='PASS';result.statuses=statuses;fs.writeFileSync(dir+'/expiry-results.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
