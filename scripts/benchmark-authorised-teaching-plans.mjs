// Local CPU/heap observations from authorised private working copies. This
// excludes AES, Auth, network, file loading and hosted function memory.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {parseArgs} from 'node:util';
import {renderModule} from '../tests/lib/render-module.mjs';
import {stagingLessonScope} from './lib/staging-lesson-scope.mjs';

process.umask(0o077);
const {values}=parseArgs({options:{'plans-dir':{type:'string'},report:{type:'string'},lessons:{type:'string'}}});
assert.ok(values['plans-dir']&&values.report,'Provide protected plans-dir and a report path');
const directory=fs.realpathSync(values['plans-dir']),checkout=fs.realpathSync(process.cwd());
assert.ok(directory!==checkout&&!directory.startsWith(checkout+path.sep),'Private working copies must stay outside the checkout');
assert.equal(fs.statSync(directory).mode&0o077,0,'Private working directory requires mode 0700');
const manifest=JSON.parse(fs.readFileSync('content/instructional/teaching-manifest.v2.json'));
const selection=stagingLessonScope(manifest.plans,values.lessons);
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const plans=selection.plans.map(binding=>{
  const file=path.join(directory,binding.lessonId+'.json');
  assert.equal(fs.statSync(file).mode&0o077,0,'Private working files require mode 0600');
  const payload=JSON.parse(fs.readFileSync(file)),plan=payload.plan??payload;
  assert.equal(hash(plan),binding.planSHA256,'Authorised working copy differs from release');
  return plan;
});
const {validateTeachingPlan}=await import(renderModule('lib/classroom/teaching-plan.ts'));
const bindings=new Map(selection.plans.map(binding=>[binding.lessonId,binding]));
const text=JSON.stringify({version:manifest.version,plans});
const samples=[];
for(let iteration=1;iteration<=21;iteration++){
  const before=process.memoryUsage(),cpu=process.cpuUsage(),started=performance.now();
  const payload=JSON.parse(text);
  assert.equal(payload.version,manifest.version);
  assert.equal(new Set(payload.plans.map(plan=>plan.lessonId)).size,selection.plans.length);
  for(const plan of payload.plans){
    const binding=bindings.get(plan.lessonId);assert.ok(binding);
    assert.equal(hash(plan),binding.planSHA256);
    validateTeachingPlan(plan,binding.source);
  }
  const ms=performance.now()-started,after=process.memoryUsage(),used=process.cpuUsage(cpu);
  samples.push({iteration,ms,cpuMs:(used.user+used.system)/1000,
    heapBefore:before.heapUsed,heapAfter:after.heapUsed,heapDelta:after.heapUsed-before.heapUsed,rssAfter:after.rss});
}
const sorted=samples.slice(1).map(row=>row.ms).sort((a,b)=>a-b);
const result={at:new Date().toISOString(),status:'PASS',scope:selection.scope,
  nodeVersion:process.version,releaseVersion:manifest.version,releaseManifestSHA256:hash(manifest),
  selectedLessons:selection.plans.map(plan=>plan.lessonId),
  plans:plans.length,fields:plans.reduce((n,plan)=>n+Object.keys(plan.fields).length,0),
  reconstructedCompactBytes:Buffer.byteLength(text),
  measurement:'local parse, all-plan hashes and actual schema/source-binding validation; protected authorised API working copies',
  excludes:['AES/key access','Auth','network','file loading','hosted server memory','concurrent requests'],
  firstCallScope:'first measured call after module import and working-copy assembly; not a guaranteed cold process',
  memoryScope:'Node process observations with normal garbage collection; deltas are not retained allocations or proof of a leak',
  firstMs:samples[0].ms,repeatedMedianMs:(sorted[9]+sorted[10])/2,samples};
fs.writeFileSync(values.report,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({status:result.status,plans:result.plans,firstMs:result.firstMs,repeatedMedianMs:result.repeatedMedianMs}));
