// Batch assembly is independent of credentials. Teacher text stays in the
// returned private payload; the public binding contains identities and hashes.
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {digest} from '../classroom-inventory.mjs';
import {renderModule} from '../../tests/lib/render-module.mjs';
const {validateTeachingPlan,teachingSource,teachingCoverage}=await import(renderModule('lib/classroom/teaching-plan.ts'));
const {ContentBlocks}=await import(renderModule('components/content-blocks.tsx'));
const sorted=values=>[...values].sort();
export function assembleTeachingBatch({payload,manifest,availability,drafts,units,version}){
 assert.ok(version&&version!==manifest.version,'Use a new release version');
 assert.equal(payload.version,manifest.version,'Private/public release versions differ');
 const originalIds=manifest.plans.map(row=>row.lessonId);
 assert.equal(new Set(originalIds).size,originalIds.length,'Duplicate existing manifest identity');
 assert.deepEqual(sorted(payload.plans.map(plan=>plan.lessonId)),sorted(originalIds),'Existing release identity mismatch');
 assert.deepEqual(sorted(availability.lessonIds),sorted(originalIds),'Availability differs from the release');
 assert.ok(drafts.length,'An empty batch cannot be released');
 const nextIds=drafts.map(plan=>plan.lessonId);
 assert.equal(new Set(nextIds).size,nextIds.length,'Duplicate draft identity');
 assert.ok(nextIds.every(id=>!originalIds.includes(id)),'An append batch cannot replace an existing plan');
 for(const plan of payload.plans){
  const binding=manifest.plans.find(row=>row.lessonId===plan.lessonId),unit=units.find(unit=>unit.id===plan.lessonId);
  assert.ok(unit?.type==='lesson','Original lesson is missing');
  assert.equal(digest(plan),binding.planSHA256,'Original plan changed');
  assert.deepEqual(teachingSource(unit,digest(unit)),binding.source,'Original source changed');
  validateTeachingPlan(plan,binding.source);
  assert.equal(Object.keys(plan.fields).length,binding.fieldCount,'Original field count changed');
  assert.deepEqual(teachingCoverage(plan).map(row=>({...row,valueSHA256:digest(plan.fields[row.path])})),binding.coverage,'Original field coverage differs');
 }
 const added=[];
 for(const plan of drafts){
  const unit=units.find(unit=>unit.id===plan.lessonId);assert.ok(unit?.type==='lesson','Draft must bind an original learner lesson');
  const source=teachingSource(unit,digest(unit));validateTeachingPlan(plan,source);
  // Validate the actual learner renderer: a retained source ID alone does not
  // prove its section is still visible (for example suppressed log headings).
  const hits=[];
  const hit=(kind,blockId,edge)=>plan.moments.filter(moment=>moment.placement.kind===kind&&moment.placement.blockId===blockId&&moment.placement.edge===edge).map(moment=>{hits.push(moment.id);return React.createElement('aside',{key:moment.id},'SYNTHETIC_ALIGNMENT');});
  renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:unit.blocks,unitId:unit.id,unitType:unit.type,promptResponses:{},onSavePromptResponse:()=>{},sectionGuidance:(section,edge)=>hit('section',unit.blocks[section.start].id,edge),partGuidance:block=>hit('heading',block.id,'before')}));
  assert.deepEqual(sorted(hits),sorted(plan.moments.map(moment=>moment.id)),'A draft insertion is absent or repeated in the actual renderer');
  added.push({lessonId:unit.id,grade:unit.grade,term:unit.term,title:unit.title,periods:plan.periods.length,source,fieldCount:Object.keys(plan.fields).length,planSHA256:digest(plan),coverage:teachingCoverage(plan).map(row=>({...row,valueSHA256:digest(plan.fields[row.path])})),moments:plan.moments.map(({id,period,schedule,minutes,placement,sourceBlockIds})=>({id,period,schedule,minutes,placement,sourceBlockIds})),activityCoverage:plan.activityCoverage});
 }
 return {payload:{...payload,version,plans:[...payload.plans,...drafts]},manifest:{...manifest,version,plans:[...manifest.plans,...added]},availability:{...availability,lessonIds:[...availability.lessonIds,...nextIds]},summary:{preservedPlans:payload.plans.length,addedPlans:drafts.length,totalPlans:payload.plans.length+drafts.length,addedPeriods:drafts.reduce((sum,plan)=>sum+plan.periods.length,0),newPlacements:added.reduce((sum,row)=>sum+row.moments.length,0)}};
}
