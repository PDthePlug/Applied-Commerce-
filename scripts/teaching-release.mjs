// Private release validation. Supply a file path or stdin, never a key value.
import fs from 'node:fs';import {openContent} from './classroom-content.mjs';
import {runtimeUnits} from './semantic-census.mjs';import {digest} from './classroom-inventory.mjs';import {renderModule} from '../tests/lib/render-module.mjs';
const {validateTeachingPlan,teachingSource,teachingCoverage}=await import(renderModule('lib/classroom/teaching-plan.ts'));
export async function validateTeachingRelease(key){
 const manifest=JSON.parse(fs.readFileSync('content/instructional/teaching-manifest.v2.json'));
 const payload=JSON.parse(openContent(JSON.parse(fs.readFileSync('content/instructional/teaching-plans.v2.enc.json')),key,'applied-commerce-classroom-v1').toString('utf8'));
 const units=await runtimeUnits();
 if(payload.version!==manifest.version||payload.plans?.length!==manifest.plans.length||new Set(payload.plans.map(p=>p.lessonId)).size!==manifest.plans.length)throw Error('Teaching release identities differ.');
 const term=units.filter(u=>u.grade===8&&u.term===1&&u.type==='lesson');
 if(term.length!==20||term.some(u=>!payload.plans.some(p=>p.lessonId===u.id)))throw Error('The term is incomplete.');
 for(const plan of payload.plans){
  const unit=units.find(u=>u.id===plan.lessonId);const binding=manifest.plans.find(p=>p.lessonId===plan.lessonId);
  if(!unit||!binding||digest(plan)!==binding.planSHA256||digest(teachingSource(unit,digest(unit)))!==digest(binding.source))throw Error('Teaching release source binding differs.');
  validateTeachingPlan(plan,binding.source);
  if(digest(teachingCoverage(plan).map(row=>({...row,valueSHA256:digest(plan.fields[row.path])})))!==digest(binding.coverage))throw Error('Instructional coverage differs.');
 }
 const skip=new Set(['sourceReferences','sourceBlockIds','review','selectionRationale','schemaVersion','version','status','lessonId','sourceUnitSHA256','id','previousLessonId','nextLessonId']);
 let preserved=0;function check(value,fields,path=''){for(const [key,item]of Object.entries(value)){if(skip.has(key))continue;const p=path?path+'.'+key:key;if(typeof item==='string'&&item.trim()){if(fields[p]!==item)throw Error('Original instructional field changed.');preserved++;}else if(item&&typeof item==='object')check(item,fields,p);}}
 const original=JSON.parse(openContent(JSON.parse(fs.readFileSync('content/instructional/benchmark-guides.v1.enc.json')),key,'applied-commerce-classroom-v1').toString('utf8'));
 for(const guide of original.guides)check(guide,payload.plans.find(p=>p.lessonId===guide.lessonId).fields);
 const enrichment=JSON.parse(openContent(JSON.parse(fs.readFileSync('content/instructional/g8-t1-l08-008.contextual.v1.enc.json')),key,'applied-commerce-classroom-v1').toString('utf8'));
 const g8=payload.plans.find(p=>p.lessonId==='g8-t1-l08-008');
 for(const [section,items]of Object.entries({distinction:enrichment.distinction,transitions:enrichment.transitions,activities:enrichment.activities})){check(items,g8.fields,'enrichment.'+section);}
 return {ok:true,teachingPlans:payload.plans.length,grade8Term1:20,periods:payload.plans.reduce((sum,p)=>sum+p.periods.length,0),instructionalFields:payload.plans.reduce((sum,p)=>sum+Object.keys(p.fields).length,0),preservedOriginalAndEnrichmentFields:preserved,educatorApproval:'REVIEW REQUIRED',privateKeyExported:false};
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 try{const i=process.argv.indexOf('--key-file');if(i<0||!process.argv[i+1])throw Error();const key=Buffer.from(fs.readFileSync(process.argv[i+1]==='-'?0:process.argv[i+1],'utf8').trim(),'base64');console.log(JSON.stringify(await validateTeachingRelease(key)));}catch{console.error('Private teaching release validation failed. No private content exported.');process.exit(1);}
}
