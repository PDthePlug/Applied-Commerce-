import fs from 'node:fs';
import {runtimeUnits} from './semantic-census.mjs';
const units=await runtimeUnits();const decisions={};const ambiguous=[];const review=[];
const add=(u,b,kind,reason)=>{decisions[`${u.id}::${b.id}`]={kind,reason,sourceText:b.text};};
for(const u of units){
 for(let i=0;i<u.blocks.length;i++){
  const b=u.blocks[i];if(b.kind!=='text'||b.type!=='section'||!/^(?:Deepening Insight|The Deeper Look(?:\s*→.*)?|Truth \/ Danger \/ Your Move)$/.test(b.text))continue;
  let end=i+1;while(end<u.blocks.length&&!['section','activity','reflection','checkpoint','portfolio','story'].includes(u.blocks[end].type))end++;
  const content=u.blocks.slice(i+1,end);const final=content.at(-1);
  for(const [offset,p]of content.entries()){
   if(p.kind!=='text'||/_{3,}|☐/.test(p.text))continue;
   const text=p.text.replace(/^(?:Your Next Step|Your Move):\s*/,'');
   const direct= /^(?:What|Who|How|Which|Where|When|If|Are|Is|Do|Did|Can|Will|Would|Given|Re-do|Look at|Think of|Think about|Name|Write|Choose|You received)\b/i.test(text);
   const conceptual=/^(?:Key idea:|Here[’']s the tension:|The Truth:|The Danger:)/.test(p.text);
   const dedicated=content.slice(offset+1).some(n=>n.kind==='text'&&/_{3,}/.test(n.text));
   if(conceptual||dedicated)add(u,p,'instruction',conceptual?'Conceptual explanation; embedded questions are rhetorical or examples':'Follow-on authored fields already capture this next step');
   else if(p===final&&(direct||/^(?:Your Next Step|The Architect's Question|The Launcher's Question):/.test(p.text))&&p.text.includes('?'))add(u,p,'reflection','Source-directed final reflection, separate from conceptual explanation; optional disclosure does not make a response mandatory');
   else if(p.text.includes('?')){add(u,p,'instruction','Preserve as conceptual reading pending educational review; do not manufacture a required response');ambiguous.push({unitId:u.id,grade:u.grade,term:u.term,blockId:p.id,text:p.text,reason:'Question embedded in conceptual prose; no explicit written direction or dedicated field',status:'educational-review-pending'});}
  }
  review.push({unitId:u.id,headingId:b.id,originalHeading:b.text,contentIds:content.map(p=>p.id)});
 }
}
// Explicit authored question labels also occur outside deeper-learning sections.
// These exact source labels are reviewed tasks, not inferred rhetorical prose.
for(const u of units)for(const b of u.blocks){
 if(b.kind!=='text'||/_{3,}/.test(b.text)||decisions[`${u.id}::${b.id}`])continue;
 if(/^The (?:Architect's|Launcher's) Question:/.test(b.text)&&b.text.includes('?'))
  add(u,b,'reflection','Explicit source-authored labelled question outside the deeper section; retain combined evidence and stable response parts');
}
// Source-specific duplicates and native selections reviewed against the full activity.
for(const [id,index,kind,reason]of[
 ['g8-t1-l04-004',65,'circle-map','Three authored circles each require people and money-belief entries'],
 ['g8-t1-l04-004',66,'instruction','Labels for the structured circle map, not a second written response'],
 ['g8-t1-l04-004',67,'instruction','Labels for the structured circle map, not a second written response'],
 ['g11-t1-l10-010',32,'reflection','Written evaluation in the authored hiring calculation activity'],
 ['g8-t1-l16-016',48,'instruction','Checkpoint group instructions are answered by the two following dedicated fields; retain the earlier combined blank'],
 ['g8-t1-l03-003',47,'instruction','Interview instructions are answered by the dedicated external-validation fields'],
 ['g9-t1-l07-007',48,'instruction','Equivalent external-validation interview instructions use the two following answer fields'],
 ['g9-t2-l29-030',34,'instruction','Map-analysis instructions are answered by the four following labelled fields'],
 ['g9-t4-l58-048',46,'instruction','Additional-question instructions are answered by the authored high-agency fields'],
 ['g9-t4-l71-061',18,'instruction','Project-reflection instructions are answered by the following labelled questions'],
 ['g8-t1-l03-003',31,'instruction','Same self-taught skill already answered at block 24; retain both historical responses'],
 ['g8-t1-l03-003',48,'instruction','Interview question answered by the existing seen-skill field'],
 ['g8-t1-l03-003',49,'instruction','Interview question answered by the existing missing-skill field'],
 ['g8-t1-l03-003',50,'instruction','Instruction for the two dedicated external-validation fields; retain historical combined response'],
 ['g9-t1-l07-007',28,'instruction','Selection instructions belong to the four category controls'],
]){const u=units.find(u=>u.id===id);add(u,u.blocks[index],kind,reason);}
const skills=units.find(u=>u.id==='g9-t1-l07-007');for(const b of skills.blocks.slice(29,33))add(skills,b,'skills','Explicit top-five selection per authored category with custom skills allowed');
// Reviewed all 59 colon-ended parents immediately followed by authored blanks.
// Keep distinct open responses (red line, statement, CV education, cover letter,
// follow-up plan, later saving list); those blanks answer a different question.
// The remaining entries are instructions for their existing child fields.
const keep=new Set(['11:49:30','11:69:35','12:7:31','12:23:42','12:24:34','12:32:35']);
for(const u of units)for(let index=0;index<u.blocks.length-1;index++){
 const b=u.blocks[index],next=u.blocks[index+1];
 if(b.type!=='paragraph'||!b.text.endsWith(':')||b.text.includes('_')||next.kind!=='text'||!/_{3,}/.test(next.text))continue;
 const ref=[u.grade,u.startLesson,index].join(':');
 if(ref==='8:45:31'){add(u,b,'projections','Three authored time projections need three independent answers; retain the original combined response');continue;}
 if(keep.has(ref))continue;
 add(u,b,'instruction','Reviewed parent instruction; the following dedicated authored fields capture the requested work');
}
fs.writeFileSync('lib/interaction-decisions.json',JSON.stringify(decisions,null,2)+'\n');fs.writeFileSync('docs/learner-hardening/deepening-coverage.json',JSON.stringify(review,null,2)+'\n');fs.writeFileSync('docs/learner-hardening/source-ambiguities.json',JSON.stringify(ambiguous,null,2)+'\n');console.log({decisions:Object.keys(decisions).length,reflections:Object.values(decisions).filter(d=>d.kind==='reflection').length,ambiguous:ambiguous.length,panels:review.length});
