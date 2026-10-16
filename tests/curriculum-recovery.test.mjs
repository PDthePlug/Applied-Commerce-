import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {gzipSync} from 'node:zlib';
const source=ts.transpileModule(fs.readFileSync('lib/curriculum.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const fresh=key=>import('data:text/javascript;base64,'+Buffer.from(source+'\n// '+key).toString('base64'));
const index={product:'Fixture',grades:[{grade:8,bundleParts:1}]};

test('a failed catalogue request can recover without a full page reload',async()=>{
 const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>++calls===1?new Response('',{status:503}):Response.json(index);
 try{const {curriculum}=await fresh('index');await assert.rejects(curriculum.index(),/503/);assert.deepEqual(await curriculum.index(),index);assert.equal(calls,2);}finally{globalThis.fetch=original;}
});

test('failed grade bundle requests are evicted while successful catalogue data is retained',async()=>{
 const original=globalThis.fetch;let indexCalls=0,bundleCalls=0;
 const bundle={grade:8,terms:[{term:1,intro:[],units:[{id:'g8-t1-l01-001',grade:8,term:1,type:'lesson',label:'Lesson 1',title:'Fixture',position:0,blocks:[]}]}]};
 globalThis.fetch=async path=>{
  if(path==='/curriculum/index.json'){indexCalls++;return Response.json(index);}
  return ++bundleCalls===1?new Response('',{status:503}):new Response(gzipSync(JSON.stringify(bundle)).toString('base64'));
 };
 try{const {curriculum}=await fresh('bundle');await assert.rejects(curriculum.grade(8),/Could not load/);assert.equal((await curriculum.grade(8)).unitCount,1);assert.equal(indexCalls,1);assert.equal(bundleCalls,2);}finally{globalThis.fetch=original;}
});
