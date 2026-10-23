// Trusted staging BUILD job only. There is no HTTP sealing endpoint. The
// original key never leaves the staging build/runtime secret binding.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import zlib from 'node:zlib';import {spawnSync}from 'node:child_process';
import {openContent,sealContent}from './classroom-content.mjs';import {runtimeUnits}from './semantic-census.mjs';import {digest}from './classroom-inventory.mjs';import {assembleTeachingBatch}from './lib/teaching-batch.mjs';
process.umask(0o077);let phase='staging-target';
const prefix='AC_STAGE_TEACHING_BATCH_';
try{
 assert.equal(process.env.VERCEL_PROJECT_ID,'prj_9MXnYeh3mxtFzcS1xzEDrTjOW2nP');assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL,'https://inxshlumnhcgiahxqewe.supabase.co');
 phase='private-input';const chunks=Object.keys(process.env).filter(name=>/^AC_STAGE_TEACHING_BATCH_\d\d$/.test(name)).sort();assert.ok(chunks.length&&chunks.length<=32);const encoded=chunks.map(name=>process.env[name]).join('');for(const name of chunks)delete process.env[name];
 const input=JSON.parse(zlib.gunzipSync(Buffer.from(encoded,'base64'),{maxOutputLength:4*1024*1024}));assert.ok(Array.isArray(input.plans)&&input.version);delete process.env.AC_STAGE_TEACHING_BATCH_INPUT;
 phase='original-key-authentication';const keyText=process.env.AC_CLASSROOM_CONTENT_KEY;assert.ok(keyText);const key=Buffer.from(keyText.trim(),'base64');assert.equal(key.length,32);const context='applied-commerce-classroom-v1';
 const root='content/instructional/',names=['teaching-plans.v2.enc.json','teaching-manifest.v2.json','teaching-availability.v2.json'];const envelope=JSON.parse(fs.readFileSync(root+names[0])),manifest=JSON.parse(fs.readFileSync(root+names[1])),availability=JSON.parse(fs.readFileSync(root+names[2]));assert.equal(digest(manifest),input.originalManifestSHA256);
 const payload=JSON.parse(openContent(envelope,key,context));
 phase='source-and-draft-review';const start=performance.now(),before=process.memoryUsage();const assembled=assembleTeachingBatch({payload,manifest,availability,drafts:input.plans,units:await runtimeUnits(),version:input.version});const sourceValidationMs=Math.round(performance.now()-start);
 phase='encryption';const sealed=sealContent(Buffer.from(JSON.stringify(assembled.payload)),key,context);assert.equal(sealed.keyId,envelope.keyId);assert.equal(digest(JSON.parse(openContent(sealed,key,context))),digest(assembled.payload));
 const values=[sealed,assembled.manifest,assembled.availability];for(let i=0;i<names.length;i++)fs.writeFileSync(root+names[i],JSON.stringify(values[i],null,2)+'\n');
 // Only encrypted/public-metadata artefacts are made retrievable from this
 // protected temporary deployment. Plaintext input is never written to disk.
 const artefacts='public/_classroom-sealed-batch';fs.mkdirSync(artefacts,{recursive:true});for(let i=0;i<names.length;i++)fs.copyFileSync(root+names[i],path.join(artefacts,names[i]));const after=process.memoryUsage();
 const summary={...assembled.summary,version:input.version,originalKeyAuthenticated:true,keyExported:false,plaintextWritten:false,sourceValidationMs,buildProcessOnly:{heapBefore:before.heapUsed,heapAfter:after.heapUsed,rssAfter:after.rss},files:names.map(name=>({name,bytes:fs.statSync(root+name).size,sha256:digest(fs.readFileSync(root+name))}))};fs.writeFileSync(artefacts+'/summary.json',JSON.stringify(summary,null,2)+'\n');
 phase='release-validation';run(process.execPath,['scripts/verify-classroom-hosted.mjs']);phase='next-build';run('npm',['run','build']);phase='public-asset-check';run(process.execPath,['scripts/check-classroom-client.mjs','--key-file','-'],keyText);console.log(JSON.stringify({...summary,stagingBuildSealing:'PASS',hostedRoleTesting:'NOT_RUN'}));
 function run(command,args,input){const result=spawnSync(command,args,{input,encoding:'utf8',timeout:240000,env:process.env,maxBuffer:8*1024*1024});if(result.status!==0)throw Error('Build stage failed');process.stdout.write(result.stdout);}
}catch{for(const name of Object.keys(process.env))if(name.startsWith(prefix))delete process.env[name];console.error(JSON.stringify({stagingBuildSealing:'FAIL',stage:phase,privateInputLogged:false,keyExported:false}));process.exitCode=1;}
