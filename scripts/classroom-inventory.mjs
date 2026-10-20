import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {runtimeUnits} from './semantic-census.mjs';

export const digest=value=>crypto.createHash('sha256').update(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value)).digest('hex');
const textOf=block=>block.kind==='text'?block.text:block.rows.map(row=>row.join(' | ')).join('\n');
const benchmarkIds=new Set(['g8-t1-l08-008','g9-t1-l02-002','g10-t2-l19-019','g11-t1-l14-014','g12-t1-l05-005']);
const referencePattern=/\b(SARS|FSCA|NCR|NSFAS|tax.free|tax threshold|tax deduction|retirement annuity|credit score|National Credit Act|Consumer Protection Act|POPIA|legal age|legally|interest rate|annual allowance|estate duty|capital gains|last will|living will|will and testament|wills|family trusts?|trust deed|bursar|minimum wage)\b/i;
const externalPattern=/\b(this week|24.hours?|21.days?|interview|visit a|ask someone|ask one person|observe a purchase|over the next)\b/i;
const reasoningPattern=/\b(analy[sz]e|evaluate|justify|design|compare|calculate|plan|assess)\b/i;

export function inspectLesson(unit,previous,next){
 const blocks=unit.blocks;const ref=block=>({blockId:block.id,text:textOf(block)});
 const start=blocks.findIndex(b=>b.kind==='text'&&/^learning outcomes$/i.test(b.text));
 const objectives=[];
 if(start>=0)for(const block of blocks.slice(start+1)){
  if(block.kind==='text'&&block.type==='section')break;
  if(block.kind==='text'&&block.type==='list')objectives.push(ref(block));
 }
 const vocabulary=blocks.filter(b=>b.kind==='table'&&/^term$/i.test(b.rows[0]?.[0]??'')).flatMap(block=>block.rows.slice(1).filter(row=>row[0]&&row[1]).map(row=>({term:row[0],definition:row[1],isiZulu:row[2]??'',afrikaans:row[3]??'',blockId:block.id})));
 const all=blocks.map(textOf).join('\n');const words=all.match(/\S+/g)??[];
 const activities=blocks.filter(b=>b.kind==='text'&&b.type==='activity').map(ref);
 const checkpoints=blocks.filter(b=>b.kind==='text'&&b.type==='checkpoint').map(ref);
 const explanations=blocks.filter(b=>b.kind==='text'&&/^Key idea:/i.test(b.text)).map(ref);
 const blankBlocks=blocks.filter(b=>b.kind==='text'&&/_{3,}/.test(b.text));
 const tables=blocks.filter(b=>b.kind==='table');const cells=tables.reduce((sum,b)=>sum+b.rows.reduce((n,row)=>n+row.length,0),0);
 const references=blocks.filter(b=>referencePattern.test(textOf(b))).map(ref);
 const followup=blocks.filter(b=>externalPattern.test(textOf(b))).map(ref);
 const longSentences=all.split(/[.!?]+/).filter(s=>(s.match(/\S+/g)??[]).length>35).length;
 const multiStep=objectives.filter(o=>reasoningPattern.test(o.text)).length;
 const complexity=words.length>1500||cells>90||blankBlocks.length>14||multiStep>=3?'extended':'standard';
 const gaps=[];
 if(!objectives.length)gaps.push({code:'OBJECTIVES_NOT_EXPLICIT',classification:'confirmed-source-omission',evidence:blocks.slice(0,3).map(ref),action:'An educator must specify observable objectives before planning contact time.'});
 if(!activities.length)gaps.push({code:'NO_ACTIVITY_MARKER',classification:'review-candidate',action:'Review prose instructions for a purposeful practical task; marker absence alone does not prove no activity.'});
 if(references.length)gaps.push({code:'CURRENT_REFERENCE_REVIEW',classification:'review-candidate',evidence:references.map(r=>r.blockId),action:'Verify current official conditions, rights, rates and dates before teaching as fact. This screen does not establish inaccuracy.'});
 if(longSentences>=3)gaps.push({code:'READING_SCAFFOLD',classification:'review-candidate',evidence:{sentencesOver35Words:longSentences},action:'Chunk reading and preteach subject vocabulary; a sentence-length screen is not a validated reading-age assessment.'});
 if(complexity==='extended')gaps.push({code:'CONTACT_TIME_REVIEW',classification:'planning-estimate',evidence:{words:words.length,tableCells:cells,blankBlocks:blankBlocks.length},action:'Select core work explicitly or use two periods; do not equate all boxes filled with understanding.'});
 if(followup.length)gaps.push({code:'OUTSIDE_PERIOD_ACTION',classification:'review-candidate',evidence:followup.map(r=>r.blockId),action:'Confirm whether this phrase is an assigned task or narrative. Schedule any actual follow-up separately; a simulation must not be reported as real action.'});
 const requirements=['Board and paper; digital lesson is optional for a teacher-led explanation.','Use observable reasoning, not response presence, to judge understanding.'];
 if(vocabulary.length)requirements.push(`Preteach ${vocabulary.slice(0,4).map(v=>v.term).join(', ')} using the source definitions and home-language discussion where appropriate.`);
 if(tables.length)requirements.push(`Model how to read ${tables.length} source table(s); provide a drawn/printed grid when a shared screen is unavailable.`);
 if(followup.length)requirements.push('Review whether the flagged real-world reference is an assigned task; schedule any actual follow-up separately and protect household/private information.');
 if(multiStep)requirements.push('Demonstrate one worked decision or reasoning example, then ask learners to explain a changed assumption.');
 if(blankBlocks.length>10)requirements.push('Chunk the response workload and give additional reading/writing time.');
 const base=objectives[0]??explanations[0]??blocks.find(b=>b.kind==='text'&&b.type==='paragraph');
 const periods=['g10-t2-l19-019','g12-t1-l05-005'].includes(unit.id)?2:benchmarkIds.has(unit.id)?1:complexity==='extended'?2:1;
 return {grade:unit.grade,term:unit.term,lessonId:unit.id,lessonNumber:unit.startLesson,originalTitle:unit.title,sourceBook:`content/source-books/APPLIED COMMERCE Grade ${unit.grade}.docx`,sourceUnitSHA256:digest(unit),reviewMethod:'All runtime blocks screened; authored objectives/vocabulary extracted. Workload and requirements are provisional educational judgments, not a moderated teaching plan.',mainConcept:{text:base?.text??'Not explicit; educator review required',basis:objectives.length?'first-authored-objective':explanations.length?'authored-key-idea':'authored-prose-requires-review',blockId:base?.blockId??base?.id??null},learningObjectives:objectives,vocabulary,explanationEvidence:explanations,activities,checkpoints,instructionalComplexity:{level:complexity,wordCount:words.length,tableCells:cells,blankBlocks:blankBlocks.length,reasoningObjectives:multiStep},anticipatedClassroomDuration:{periods,minutes:periods*45,status:benchmarkIds.has(unit.id)?'benchmark-designed; pilot required':'provisional-screen; educator review required',assumptions:'A period is 45 minutes. A long reading/task load suggests two periods. Real-world follow-up is outside this estimate; no lessons are automatically combined.',outsidePeriodTaskScreen:followup.length>0,outsidePeriodTaskStatus:followup.length?'review-candidate; narrative/task distinction requires educator confirmation':'no-phrase-match; not proof that no follow-up exists'},classroomRequirements:requirements,continuity:{previous:previous?{id:previous.id,title:previous.title,grade:previous.grade}:null,next:next?{id:next.id,title:next.title,grade:next.grade}:null,status:'Source sequence adjacency; not proof of prerequisite mastery'},prerequisiteReview:{sourceSequencingHint:previous?.id??null,skillsToCheck:[...(tables.length?['Read a labelled table.']:[]),...(/\b(percent|interest rate|compound)\b/i.test(all)?['Explain a percentage and multiply/divide before financial calculations.']:[]),'Recall relevant ideas from the preceding source lesson; diagnose rather than assume mastery.'],status:'Educator diagnostic required; not an authored prerequisite list'},educationalFindings:gaps,benchmark:benchmarkIds.has(unit.id)};
}

export async function buildInventory(){
 const units=await runtimeUnits();const lessons=units.filter(u=>u.type==='lesson');
 const sourceBooks=[8,9,10,11,12].map(grade=>{const file=`content/source-books/APPLIED COMMERCE Grade ${grade}.docx`;return{grade,path:file,sha256:digest(fs.readFileSync(file))};});
 return {schemaVersion:1,reviewVersion:'classroom-screen-2026-10-20.3',scope:'395 lessons; all blocks screened. Five benchmark guides receive detailed instructional design and self-review. Remaining lessons require educator moderation before publication.',sourceBooks,lessons:lessons.map((u,i)=>inspectLesson(u,lessons[i-1],lessons[i+1])),assessments:units.filter(u=>u.type==='assessment').map(u=>({id:u.id,grade:u.grade,term:u.term,title:u.title,blocks:u.blocks.length,sourceUnitSHA256:digest(u),reviewStatus:'Existing assessment retained; item/memorandum moderation and current-reference checking are not certified by this inventory.'}))};
}

if(process.argv[1]===new URL(import.meta.url).pathname){
 const inventory=await buildInventory();fs.mkdirSync('docs/classroom',{recursive:true});fs.mkdirSync('content/instructional',{recursive:true});
 fs.writeFileSync('docs/classroom/educational-inventory.json',JSON.stringify(inventory,null,2)+'\n');
 const csv=value=>'"'+String(value??'').replaceAll('"','""')+'"';
 const header=['grade','term','lesson_id','number','original_title','main_concept_from_source','authored_objectives','complexity','estimated_minutes','estimate_status','classroom_requirements','finding_codes','previous','next'];
 const rows=inventory.lessons.map(l=>[l.grade,l.term,l.lessonId,l.lessonNumber,l.originalTitle,l.mainConcept.text,l.learningObjectives.map(o=>o.text).join(' | '),l.instructionalComplexity.level,l.anticipatedClassroomDuration.minutes,l.anticipatedClassroomDuration.status,l.classroomRequirements.join(' | '),l.educationalFindings.map(g=>g.code).join(' | '),l.continuity.previous?.id,l.continuity.next?.id]);
 fs.writeFileSync('docs/classroom/educational-inventory.csv',[header,...rows].map(row=>row.map(csv).join(',')).join('\n')+'\n');
 const catalog=inventory.lessons.map(l=>({id:l.lessonId,grade:l.grade,term:l.term,title:l.originalTitle,number:l.lessonNumber,sourceUnitSHA256:l.sourceUnitSHA256,benchmark:l.benchmark}));
 fs.writeFileSync('content/instructional/catalog.v1.json',JSON.stringify(catalog,null,2)+'\n');
 const files=fs.readdirSync('public/curriculum').filter(name=>fs.statSync(path.join('public/curriculum',name)).isFile()).map(name=>({path:`public/curriculum/${name}`,sha256:digest(fs.readFileSync(path.join('public/curriculum',name)))}));
 fs.writeFileSync('content/instructional/source-lock.v1.json',JSON.stringify({status:'Observed baseline snapshot, not a new curriculum release or activation of the existing source-governance gate',sourceBooks:inventory.sourceBooks,runtimeFiles:files,unitFingerprints:[...inventory.lessons.map(l=>({id:l.lessonId,sha256:l.sourceUnitSHA256})),...inventory.assessments.map(a=>({id:a.id,sha256:a.sourceUnitSHA256}))]},null,2)+'\n');
 console.log(JSON.stringify({lessons:inventory.lessons.length,assessments:inventory.assessments.length,byGrade:[8,9,10,11,12].map(g=>({grade:g,lessons:inventory.lessons.filter(l=>l.grade===g).length})),noExplicitObjectives:inventory.lessons.filter(l=>!l.learningObjectives.length).map(l=>l.lessonId),twoPeriodEstimates:inventory.lessons.filter(l=>l.anticipatedClassroomDuration.periods===2).length}));
}
