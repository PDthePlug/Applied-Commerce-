import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import ts from 'typescript';
const cache=new Map();
const client='data:text/javascript;base64,'+Buffer.from('export const createClient=()=>globalThis.__institutionClient;').toString('base64');
function moduleUrl(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);let code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;code=code.replace(/from "([^"]+)"/g,(full,ref)=>{if(ref==='@/lib/supabase/client')return 'from "'+client+'"';if(ref.startsWith('@/'))return 'from "'+moduleUrl(ref.slice(2)+'.ts')+'"';if(ref.startsWith('.'))return 'from "'+moduleUrl(path.resolve(path.dirname(file),ref)+'.ts')+'"';return full;});const result='data:text/javascript;base64,'+Buffer.from(code).toString('base64');cache.set(file,result);return result;}
const {loadCohortLearningInsights,loadCohortPeople,loadInstitutionalContext}=await import(moduleUrl('lib/institutional/provisioning.ts'));
const unit='g8-t1-l01-001';const keys=[unit+'::prompt-answer::response',unit+'::prompt-second::response'];
const content={id:unit,grade:8,term:1,title:'Fixture lesson',type:'lesson',label:'Lesson 1',blocks:[{id:'answer',kind:'text',type:'activity',text:'Explain one example.'},{id:'second',kind:'text',type:'activity',text:'Explain another example.'}]};
const responses=Array.from({length:5},(_,n)=>keys.map((prompt_key,i)=>({learner_id:'learner-'+n,prompt_key,response:'answer-'+i,grade:8,term:1,unit_id:unit}))).flat();
const fixture={cohort_enrolments:Array.from({length:5},(_,n)=>({learner_id:'learner-'+n})),curriculum_releases:{id:'release'},lesson_progress:[],prompt_responses:responses,evidence_records:[{id:'evidence-1',learner_id:'learner-0',response_key:keys[0]}],evidence_reviews:[{evidence_record_id:'evidence-1',status:'accepted',response_value_at_review:'answer-0',reviewed_at:'2026-10-12T12:00:00Z'}]};
globalThis.__institutionClient={from:table=>{const builder={select:()=>builder,eq:()=>builder,in:()=>builder,order:()=>builder,single:async()=>({data:fixture[table],error:null}),range:async(a,b)=>({data:fixture[table].slice(a,b+1),error:null}),then:resolve=>resolve({data:fixture[table],count:0,error:null})};return builder;}};
const curriculum=await import(moduleUrl('lib/curriculum.ts'));curriculum.curriculum.unit=async()=>content;
test('institution review coverage includes unreviewed authored evidence, rather than only database review rows',async()=>{const summary=await loadCohortLearningInsights('cohort');assert.equal(summary.evidenceRecords,10);assert.equal(summary.reviewedEvidence,1);assert.equal(summary.reviewCoverage,10);});
test('institution reporting no longer counts approvals of revised answers',async()=>{fixture.evidence_reviews[0].response_value_at_review='old answer';const summary=await loadCohortLearningInsights('cohort');assert.equal(summary.reviewedEvidence,0);assert.equal(summary.reviewCoverage,0);});

test('a saved pending review does not inflate administrator coverage',async()=>{fixture.evidence_reviews[0].response_value_at_review='answer-0';fixture.evidence_reviews[0].status='pending';const summary=await loadCohortLearningInsights('cohort');assert.equal(summary.evidenceRecords,10);assert.equal(summary.reviewedEvidence,0);assert.equal(summary.reviewCoverage,0);assert.equal(summary.needsRevision,0);});


test('institution loaders cross API row limits and bound profile filters without losing names',async()=>{
 const people=Array.from({length:1201},(_,i)=>({learner_id:'learner-'+i,status:'active'}));
 const profiles=people.map(row=>({id:row.learner_id,display_name:row.learner_id,status:'active'}));
 const schools=Array.from({length:1001},(_,i)=>({id:'school-'+i,name:'School '+i}));
 const tables={cohort_enrolments:people,cohort_staff:[],profiles,schools,cohorts:schools.map(row=>({id:'cohort-'+row.id,school_id:row.id})),school_memberships:schools.map(row=>({school_id:row.id,role:'admin',status:'active'}))};
 const filters=[];
 globalThis.__institutionClient={rpc:async()=>({data:false,error:null}),from:table=>{
  let ids;const builder={select:()=>builder,eq:()=>builder,order:()=>builder,in:(column,values)=>{if(table==='profiles'){filters.push(values.length);ids=values;}return builder;},range:async(a,b)=>({data:tables[table].filter(row=>!ids||ids.includes(row.id)).slice(a,b+1),error:null}),then:resolve=>resolve({data:tables[table].slice(0,1000),error:null})};return builder;
 }};
 const cohort=await loadCohortPeople('cohort');assert.equal(cohort.learners.length,1201);assert.ok(cohort.learners.every(row=>row.profile?.display_name===row.learner_id));assert.ok(filters.every(size=>size<=100));
 const context=await loadInstitutionalContext('admin');assert.equal(context.memberships.length,1001);assert.equal(context.schools.length,1001);assert.equal(context.cohorts.length,1001);
});
