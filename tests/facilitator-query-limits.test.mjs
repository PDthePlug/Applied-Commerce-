import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const dataUrl=code=>'data:text/javascript;base64,'+Buffer.from(code).toString('base64');
const cache=new Map();
const stubs={
 react:dataUrl('export const useCallback=()=>{};export const useEffect=()=>{};export const useState=()=>{};'),
 '@/lib/supabase/client':dataUrl('export const createClient=()=>globalThis.__facilitatorClient;'),
 '@/lib/auth-context':dataUrl('export const useAuth=()=>({});'),
 '@/lib/facilitator/access-context':dataUrl('export const useFacilitatorAccess=()=>null;')
};
function moduleUrl(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 let code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 code=code.replace(/from ["']([^"']+)["']/g,(whole,ref)=>{
  const target=stubs[ref]??(ref.startsWith('@/')?moduleUrl(ref.slice(2)+'.ts'):ref.startsWith('.')?moduleUrl(path.resolve(path.dirname(file),ref)+'.ts'):null);
  return target?'from "'+target+'"':whole;
 });
 const url=dataUrl(code);cache.set(file,url);return url;
}
const {loadSupabaseFacilitatorWorkspace}=await import(moduleUrl('lib/facilitator/supabase-data-source.ts'));
const {curriculum}=await import(moduleUrl('lib/curriculum.ts'));
const unit='g8-t1-l01-001',key=unit+'::prompt-answer::response';
curriculum.unit=async()=>({id:unit,grade:8,term:1,title:'Fixture lesson',type:'lesson',label:'Lesson 1',blocks:[{id:'answer',kind:'text',type:'activity',text:'Explain one concrete example.'}]});

for(const admin of [false,true])test(`${admin?'platform administrator':'assigned facilitator'} workspace retains all 1,201 authorized learners and bounds every ID filter`,async()=>{
 const learners=Array.from({length:1201},(_,i)=>'learner-'+String(i).padStart(4,'0'));
 const cohorts=learners.map((_,i)=>({id:'cohort-'+i,name:'Cohort '+i,school_id:'school',status:'active',grade:8,academic_year:2026}));
 const tables={
  cohort_staff:cohorts.map((row,i)=>({id:'staff-'+i,user_id:'facilitator',cohort_id:row.id,status:'active'})),cohorts,
  cohort_enrolments:learners.map((id,i)=>({id:'enrol-'+i,learner_id:id,cohort_id:cohorts[i].id,status:'active'})),
  schools:[{id:'school',name:'Fixture school'}],curriculum_releases:[{id:'release',release_key:'ac-runtime-3'}],
  profiles:learners.map(id=>({id,display_name:id})),learner_profiles:learners.map(user_id=>({user_id,preferred_name:user_id,current_grade:8})),
  lesson_progress:[],lesson_notes:[],
  prompt_responses:learners.map((learner_id,i)=>({id:'answer-'+i,learner_id,curriculum_release_id:'release',prompt_key:key,response:'A concrete example',grade:8,term:1,unit_id:unit})),
  evidence_records:learners.map((learner_id,i)=>({id:'evidence-'+i,learner_id,response_key:key})),
  evidence_reviews:learners.map((_,i)=>({id:'review-'+i,evidence_record_id:'evidence-'+i,status:'accepted',criteria_scores:{},feedback:'Reviewed',response_value_at_review:'A concrete example'}))
 };
 const requests=[];
 globalThis.__facilitatorClient={rpc:async()=>({data:admin,error:null}),from:table=>{
  const filters=[];
  const rows=()=>tables[table].filter(row=>filters.every(match=>match(row)));
  const query={select:()=>query,order:()=>query,eq:(column,value)=>{filters.push(row=>row[column]===value);return query;},in:(column,values)=>{
   assert.ok(values.length<=100,`${table}.${column} must use a bounded filter`);requests.push({table,column,size:values.length});filters.push(row=>values.includes(row[column]));return query;
  },single:async()=>({data:rows()[0],error:null}),range:async(a,b)=>({data:rows().slice(a,Math.min(b+1,a+1000)),error:null}),then:resolve=>resolve({data:rows().slice(0,1000),error:null})};return query;
 }};
 const workspace=await loadSupabaseFacilitatorWorkspace('facilitator');
 assert.equal(workspace.cohortIds.length,1201);assert.equal(workspace.learners.length,1201);
 assert.ok(workspace.learners.every(row=>row.state.profile.displayName===row.id&&row.records.length===1&&Object.keys(row.reviews).length===1));
 assert.equal(new Set(workspace.learners.map(row=>row.id)).size,1201);
 assert.ok(requests.some(row=>row.table==='evidence_reviews'));assert.ok(requests.every(row=>row.size<=100));
});
