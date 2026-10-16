import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import ts from 'typescript';
function url(file,replacements={}){let code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;for(const [a,b] of Object.entries(replacements))code=code.replaceAll('"'+a+'"','"'+b+'"');return 'data:text/javascript;base64,'+Buffer.from(code).toString('base64');}
const mergeUrl=url('lib/learner-record.ts');const {mergeLearningState}=await import(mergeUrl);const {readAllRows,readRowsByIds}=await import(url('lib/supabase/read-all.ts'));const {currentReviews}=await import(url('lib/evidence/current-reviews.ts'));
const empty=()=>({version:2,previousResponses:{},completed:{},completedMeta:{},responses:{},promptResponses:{}});
test('completion reversal survives reconciliation with older remote completion',()=>{const local={...empty(),completionUpdatedAt:{unit:'2026-10-12T12:00:00Z'}};const remote={...empty(),completed:{unit:'2026-10-12T11:00:00Z'}};assert.equal(mergeLearningState(local,remote).completed.unit,undefined);});
test('newer remote completion takes precedence over older local reversal',()=>{const local={...empty(),completionUpdatedAt:{unit:'2026-10-12T11:00:00Z'}};const remote={...empty(),completed:{unit:'2026-10-12T12:00:00Z'},completionUpdatedAt:{unit:'2026-10-12T12:00:00Z'}};assert.ok(mergeLearningState(local,remote).completed.unit);});
test('cleared note with a newer timestamp stays cleared',()=>{const local={...empty(),responses:{unit:''},responseUpdatedAt:{unit:'2026-10-12T12:00:00Z'}};const remote={...empty(),responses:{unit:'old note'},responseUpdatedAt:{unit:'2026-10-12T11:00:00Z'}};assert.equal(mergeLearningState(local,remote).responses.unit,'');});
test('paginated reads return more than the default server result cap',async()=>{const data=Array.from({length:1251},(_,id)=>({id}));let requests=0;const r=await readAllRows({range:async(a,b)=>{requests++;return {data:data.slice(a,b+1),error:null};}});assert.equal(r.data.length,1251);assert.equal(requests,3);assert.equal(r.data[1250].id,1250);});
test('pagination failures reject the entire read rather than returning partial success',async()=>{await assert.rejects(readAllRows({range:async a=>a===0?{data:Array(500).fill({id:1}),error:null}:{data:null,error:new Error('offline')}}),/offline/);});
test('approval is tied to the reviewed answer, including after revision',()=>{const review={status:'accepted',responseValueAtReview:'first'};assert.equal(currentReviews({key:review},{key:'first'}).key,review);assert.deepEqual(currentReviews({key:review},{key:'revised'}),{});assert.deepEqual(currentReviews({key:{status:'accepted'}},{key:'first'}),{});});

test('ID-filtered reads bound URLs, paginate each batch and avoid duplicate IDs',async()=>{
 const ids=Array.from({length:1201},(_,i)=>'learner-'+i);const batches=[];
 const result=await readRowsByIds([...ids,...ids.slice(0,3)],batch=>{
  batches.push(batch);const rows=batch.flatMap(id=>Array.from({length:7},(_,n)=>({id:id+'-'+n,learner_id:id})));
  return {range:async(a,b)=>({data:rows.slice(a,b+1),error:null})};
 });
 assert.equal(result.data.length,1201*7);assert.equal(new Set(result.data.map(row=>row.id)).size,1201*7);
 assert.ok(batches.every(batch=>batch.length<=100));assert.equal(batches.flat().length,1201);
});

test('empty ID filters make no request and a failed later batch cannot return partial success',async()=>{
 assert.deepEqual((await readRowsByIds([],()=>{throw new Error('must not query');})).data,[]);
 await assert.rejects(readRowsByIds(Array.from({length:101},(_,i)=>String(i)),batch=>({range:async()=>batch[0]==='100'?{data:null,error:new Error('permission lookup failed')}:{data:batch.map(id=>({id})),error:null}})),/permission lookup failed/);
});
