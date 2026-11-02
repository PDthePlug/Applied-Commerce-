import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {runtimeUnits} from './semantic-census.mjs';
const units=(await runtimeUnits()).filter(u=>u.type==='lesson');const registry={};const coverage=[];
for(const grade of [8,9,10,11,12]){
 const drafts=fs.readFileSync(`lib/lesson-wraps/grade-${grade}.tsv`,'utf8').trim().split('\n').map(line=>{const [number,learned,why,...extra]=line.split('\t');assert.equal(extra.length,0);const takeaways=learned.split('|');assert.equal(takeaways.length,2);assert.ok(takeaways.every(t=>t.length>20&&t.length<190));assert.ok(why.length>20&&why.length<240);return {number:Number(number),takeaways,why};});
 const lessons=units.filter(u=>u.grade===grade);assert.equal(drafts.length,lessons.length);assert.equal(new Set(drafts.map(d=>d.number)).size,drafts.length);
 for(const [position,unit]of lessons.entries()){
  const draft=drafts.find(d=>d.number===unit.startLesson);assert.ok(draft,unit.id);
  const headings=unit.blocks.filter(b=>b.kind==='text'&&/^(?:✨\s*)?Lesson Wrap$/i.test(b.text));assert.ok(headings.length<=1,unit.id);
  const finalClosing=unit.blocks.findLast(b=>b.kind==='text'&&b.type==='section'&&/^(?:Well Done\.|A Word Before You Go|Ms\. Daniels' (?:Final )?Closing Words)$/.test(b.text));
  const closingStart=headings[0]??(finalClosing&&!unit.blocks.slice(unit.blocks.indexOf(finalClosing)+1).some(b=>['activity','checkpoint','reflection'].includes(b.type))?finalClosing:null);
  const authoredStart=closingStart?unit.blocks.indexOf(closingStart):-1;
  if(authoredStart>=0)assert.ok(!unit.blocks.slice(authoredStart+1).some(b=>['activity','checkpoint'].includes(b.type)),unit.id+' has later instructional work requiring placement review');
  const vocabulary=unit.blocks.findIndex(b=>b.kind==='text'&&b.text==='Key Vocabulary');const objectiveBlocks=unit.blocks.slice(0,vocabulary<0?8:vocabulary).filter(b=>b.type==='list');
  const sourceRefs=objectiveBlocks.length?objectiveBlocks.map(b=>b.id):unit.blocks.filter(b=>b.kind==='text').slice(0,4).map(b=>b.id);
  const next=lessons[position+1];
  registry[unit.id]={takeaways:draft.takeaways,why:draft.why,sourceRefs,sourceSHA256:crypto.createHash('sha256').update(JSON.stringify(unit)).digest('hex'),authoredHeadingId:headings[0]?.id??null,closingStartId:closingStart?.id??null,...(next?{next:{id:next.id,title:next.title,grade:next.grade,term:next.term}}:{})};
  coverage.push({grade,term:unit.term,lesson:unit.startLesson,unitId:unit.id,title:unit.title,sourceRefs,authoredClosing:headings.length?'partial-authored-wrap':closingStart?'authored-final-closing':'no-explicit-wrap',authoredHeadingId:headings[0]?.id??null,closingStartId:closingStart?.id??null,correction:closingStart?'incorporate existing closing and retain controls; add lesson-specific synthesis':'append lesson-specific synthesis after all source content',contentReview:'agent source review; owner curriculum acceptance pending',...registry[unit.id]});
 }
}
assert.equal(Object.keys(registry).length,395);assert.equal(new Set(Object.values(registry).map(w=>JSON.stringify(w.takeaways))).size,395,'Wrap takeaways must be lesson-specific');
fs.writeFileSync('lib/lesson-wraps/registry.json',JSON.stringify(registry,null,2)+'\n');fs.writeFileSync('docs/learner-hardening/wrap-coverage.json',JSON.stringify({baseCommit:'ab52273eae7d5d459c77e30a9d7bfdea8d8540ff',lessons:395,assessmentsExcluded:4,rows:coverage},null,2)+'\n');console.log(JSON.stringify({lessons:coverage.length,authored:coverage.filter(r=>r.authoredHeadingId).length,added:coverage.filter(r=>!r.authoredHeadingId).length}));
