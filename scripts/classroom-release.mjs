import fs from 'node:fs';
import {openContent} from './classroom-content.mjs';
import {runtimeUnits,typescriptModule} from './semantic-census.mjs';
import {digest} from './classroom-inventory.mjs';

export async function validatePrivateClassroomRelease(keyFile){
 const envelope=JSON.parse(fs.readFileSync('content/instructional/benchmark-guides.v1.enc.json','utf8'));
 const key=Buffer.from(fs.readFileSync(keyFile==='-'?0:keyFile,'utf8').trim(),'base64');
 const payload=JSON.parse(openContent(envelope,key,'applied-commerce-classroom-v1').toString('utf8'));
 const catalog=JSON.parse(fs.readFileSync('content/instructional/catalog.v1.json','utf8'));
 const {validateTeacherGuide}=await import(typescriptModule('lib/classroom/model.ts'));
 const units=await runtimeUnits();
 if(payload.guides?.length!==5||new Set(payload.guides.map(g=>g.grade)).size!==5)throw new Error('One benchmark per grade is required.');
 const summaries=[];
 for(const guide of payload.guides){
  validateTeacherGuide(guide,catalog);
  const unit=units.find(u=>u.id===guide.lessonId);
  if(!unit||digest(unit)!==guide.sourceUnitSHA256)throw new Error('Source fingerprint differs.');
  for(const ref of guide.sourceReferences){
   const block=unit.blocks.find(b=>b.id===ref.blockId);
   const text=block?.kind==='text'?block.text:block?.rows.map(row=>row.join(' | ')).join('\n');
   if(!text?.startsWith(ref.excerpt))throw new Error('Guide excerpt does not match its source block.');
  }
  summaries.push({lessonId:guide.lessonId,grade:guide.grade,term:guide.term,originalTitle:guide.originalTitle,version:guide.version,status:guide.status,sourceUnitSHA256:guide.sourceUnitSHA256,sourceReferences:guide.sourceReferences.map(r=>({blockId:r.blockId,excerptSHA256:digest(r.excerpt)})),objectiveCount:guide.objectives.length,periods:guide.periods.map(p=>({minutes:p.minutes,stageMinutes:p.stages.map(s=>s.minutes)})),discussionCount:guide.discussion.length,understandingCheckCount:guide.understandingChecks.length,adaptationFields:Object.keys(guide.differentiation),qualityCheckCount:guide.review.qualityChecks.length,humanReviewStatus:guide.review.status});
 }
 return {schemaVersion:1,version:payload.version,status:'draft-review',plaintextSHA256:envelope.plaintextSHA256,keyId:envelope.keyId,validation:'Private content schema, timing, source excerpts and unit fingerprints validated. This manifest is not independent educational approval.',guides:summaries};
}
if(process.argv[1]===new URL(import.meta.url).pathname){
 const i=process.argv.indexOf('--key-file');if(i<0||!process.argv[i+1])throw new Error('Provide --key-file with a private content-key path; never pass a key value.');
 const manifest=await validatePrivateClassroomRelease(process.argv[i+1]);
 if(process.argv.includes('--write-manifest'))fs.writeFileSync('content/instructional/benchmark-manifest.v1.json',JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({ok:true,guides:manifest.guides.length,periods:manifest.guides.reduce((n,g)=>n+g.periods.length,0),allPeriodMinutes:45,privateKeyExported:false,humanEducatorApproval:'NOT YET REVIEWED'}));
}
