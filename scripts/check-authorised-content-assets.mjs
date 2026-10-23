// Scan public build assets using already-authorised private staging payloads.
// Does not retrieve, export or require the server's classroom key.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {loadRoleFixtures}from './lib/validation-target.mjs';
const dir=process.env.AC_ROLE_FIXTURES,{config}=loadRoleFixtures(dir);assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const samples=new Set();
for(const name of fs.readdirSync(dir+'/plans').filter(name=>name.endsWith('.json'))){const payload=JSON.parse(fs.readFileSync(dir+'/plans/'+name));assert.ok(payload.plan?.fields);for(const value of Object.values(payload.plan.fields))if(value.length>=70){samples.add(value);samples.add(JSON.stringify(value).slice(1,-1));}}
assert.ok(samples.size>1000);let assets=0;function walk(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,entry.name);if(entry.isDirectory())walk(file);else{const bytes=fs.readFileSync(file);assets++;assert.ok(![...samples].some(value=>bytes.includes(Buffer.from(value))),'Private classroom prose found in public asset');}}}
walk('.next/static');walk('public');const result={assets,privateSentinels:samples.size,matches:[],provenance:'Authorised staging payloads for all 24 unchanged plans',keyScan:'NOT PERFORMED; original key unavailable to coding process',keyExported:false};
console.log(JSON.stringify(result));
