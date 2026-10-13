import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const cache=new Map();
function moduleUrl(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 let code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replace(/from ["']([^"']+)["']/g,(full,ref)=>ref.startsWith('.')?'from "'+moduleUrl(path.resolve(path.dirname(file),ref)+'.ts')+'"':full);
 const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');cache.set(file,url);return url;
}
const model=await import(moduleUrl('lib/facilitator/model.ts'));
const {buildEvidenceReport}=await import(moduleUrl('lib/evidence/reporting.ts'));
const record=(key,mode='rubric')=>({responseKey:key,responseValue:'current answer',definition:{key,grade:8,term:1,unitId:'lesson',unitTitle:'Lesson',promptId:key,slot:'response',prompt:'Explain',stage:'self-awareness',kind:'reflection',domains:['self-awareness'],assessmentMode:mode,portfolioEligible:true,deterministicRule:{kind:'presence'}},captured:true,autoCheck:{rule:'presence',passed:true,label:'Captured',detail:'Saved'}});
const review=(key,status,level=3)=>({responseKey:key,status,criteria:{reasoning:level},feedback:'Feedback',reviewedAt:'2026-10-13T00:00:00Z',responseValueAtReview:'current answer'});
const state={version:2,completed:{},responses:{},promptResponses:{},profile:{displayName:'Dedicated learner',grade:8}};

test('pending decisions remain in workload and do not count as completed reviews or rubric results',()=>{
 const records=['pending','accepted','needs-revision','verified'].map(key=>record(key));
 const reviews=Object.fromEntries(records.map(r=>[r.responseKey,review(r.responseKey,r.responseKey,r.responseKey==='pending'?4:r.responseKey==='accepted'?2:3)]));
 const learner=model.buildLearnerSummary({state,records,reviews});
 assert.equal(learner.reviewedCount,3);assert.equal(learner.pendingCount,1);assert.equal(learner.reviewRate,75);
 assert.equal(model.buildCohortSummary([learner]).pendingCount,1);
 const report=buildEvidenceReport({learnerName:'Dedicated learner',grade:8,records,reviews});
 assert.deepEqual(report.totals,{responses:4,portfolioEligible:4,reviewed:3,accepted:1,needsRevision:1,verified:1});
 assert.equal(report.averageRubricLevel,2.67);
 for(const rows of [model.buildDomainCoverage(records,reviews),model.buildKindCoverage(records,reviews),model.buildTermCoverage(records,reviews).filter(x=>x.count)])assert.equal(rows[0].reviewed,3);
 assert.equal(report.byDomain[0].reviewed,3);assert.equal(report.byTerm[0].reviewed,3);
});

test('saved pending rubric and verification decisions remain in their respective queues',()=>{
 const records=[record('rubric'),record('verification','verification')];
 const reviews={rubric:review('rubric','pending'),verification:review('verification','pending')};
 const learner=model.buildLearnerSummary({state,records,reviews});
 assert.equal(learner.status,'review-needed');assert.equal(learner.pendingCount,2);assert.equal(learner.reviewRate,0);
 const priorities=model.buildReviewPriorities(records,reviews);
 assert.equal(priorities.find(x=>x.key==='rubric').count,1);assert.equal(priorities.find(x=>x.key==='verification').count,1);
 assert.equal(buildEvidenceReport({learnerName:'Dedicated learner',records,reviews}).averageRubricLevel,null);
});

test('a decision tied to an earlier answer cannot count as current review coverage',()=>{
 const records=[record('answer')],reviews={answer:{...review('answer','accepted'),responseValueAtReview:'old answer'}};
 assert.equal(model.buildLearnerSummary({state,records,reviews}).reviewedCount,0);
 assert.equal(buildEvidenceReport({learnerName:'Dedicated learner',records,reviews}).totals.accepted,0);
});
