import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {runtimeUnits} from '../scripts/semantic-census.mjs';import {digest} from '../scripts/classroom-inventory.mjs';import {renderModule} from './lib/render-module.mjs';
const {teachingSource,validateTeachingPlan,teachingCoverage}=await import(renderModule('lib/classroom/teaching-plan.ts'));
const {ContentBlocks}=await import(renderModule('components/content-blocks.tsx'));
const units=await runtimeUnits();const manifest=JSON.parse(fs.readFileSync('content/instructional/teaching-manifest.v2.json'));
test('the reviewed batch includes exactly 20 term lessons and four preserved additional benchmarks',()=>{
 assert.equal(manifest.plans.length,24);const term=units.filter(u=>u.grade===8&&u.term===1&&u.type==='lesson');assert.equal(term.length,20);assert.deepEqual(manifest.plans.filter(p=>p.grade===8).map(p=>p.lessonId).sort(),term.map(u=>u.id).sort());
 assert.equal(new Set(manifest.plans.map(p=>p.lessonId)).size,24);assert.ok(new Set(manifest.plans.map(p=>p.moments.filter(m=>m.schedule==='classroom').length)).size>=4);assert.equal(manifest.plans.reduce((s,p)=>s+p.periods,0),31);
});
test('all placements actually render once and source bindings match unchanged runtime units',()=>{
 for(const binding of manifest.plans){const unit=units.find(u=>u.id===binding.lessonId);assert.deepEqual(teachingSource(unit,digest(unit)),binding.source);const hits=[];
 const hit=(kind,id,edge)=>binding.moments.filter(m=>m.placement.kind===kind&&m.placement.blockId===id&&m.placement.edge===edge).map(m=>{hits.push(m.id);return React.createElement('aside',{key:m.id,'data-alignment':m.id},'SYNTHETIC');});
 renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:unit.blocks,unitId:unit.id,unitType:unit.type,promptResponses:{},onSavePromptResponse:()=>{},sectionGuidance:(section,edge)=>hit('section',unit.blocks[section.start].id,edge),partGuidance:block=>hit('heading',block.id,'before')}));
 assert.deepEqual(hits.sort(),binding.moments.map(m=>m.id).sort(),binding.lessonId);
 assert.equal(binding.coverage.length,binding.fieldCount);assert.ok(binding.coverage.every(row=>row.locations.length));assert.ok(binding.source.activityIds.every(id=>binding.activityCoverage.some(row=>row.blockId===id)));
 }
});
function sample(){const source=manifest.plans.find(p=>p.lessonId==='g8-t1-l06-006').source;const fields=Object.fromEntries(['purpose.0','purpose.1','outcome.0','prerequisites.0','materials.0','vocabulary.0','misconceptions.0','context.0','access.0','period.title','stage.title'].map(id=>[id,'SYNTHETIC_'+id]));const group={heading:'Explain',fields:Object.keys(fields).filter(id=>!['period.title','stage.title'].includes(id))};return {source,plan:{schemaVersion:2,status:'educator-review-required',version:'synthetic',lessonId:source.id,sourceUnitSHA256:source.sourceUnitSHA256,fields,preparation:[group],periods:[{title:'period.title',minutes:45,moments:['one']}],moments:[{id:'one',title:'stage.title',period:0,schedule:'classroom',minutes:45,placement:{kind:'section',blockId:source.sections[0],edge:'before',review:'Synthetic boundary contract'},sourceBlockIds:[source.sections[0]],core:[group,{heading:'Ask learners',fields:['purpose.1']},{heading:'Look for understanding',fields:['outcome.0']}],depth:[],links:[]}],activityCoverage:source.activityIds.map(blockId=>({blockId,momentId:'one',disposition:'classroom'})),review:{sourceRead:true,alignmentReviewed:true,timingRationale:'Synthetic validator fixture, no educational approval',limits:['Synthetic']}}};}
test('variable-stage validator rejects orphans, wrong timings, unsafe boundaries, missing essentials and missing activity dispositions',()=>{
 const {source,plan}=sample();validateTeachingPlan(plan,source);assert.ok(teachingCoverage(plan).every(f=>f.locations.length));
 for(const mutate of [p=>p.fields.orphan='PRIVATE_SYNTHETIC',p=>p.moments[0].minutes=44,p=>p.moments[0].placement.blockId=source.blockIds.find(id=>!source.sections.includes(id)),p=>p.activityCoverage.pop(),p=>p.fields.outcome={value:'wrong type'},p=>p.moments[0].links.push('missing'),p=>p.moments[0].schedule='later',p=>p.moments[0].core=[],p=>{delete p.fields['vocabulary.0'];p.preparation[0].fields=p.preparation[0].fields.filter(id=>id!=='vocabulary.0');p.moments[0].core[0].fields=p.moments[0].core[0].fields.filter(id=>id!=='vocabulary.0');}]){const copy=structuredClone(plan);mutate(copy);assert.throws(()=>validateTeachingPlan(copy,source));}
});
test('coverage maps retain the approved 100 Grade 8 fields and all 24 contextual clarification fields',()=>{
 const binding=manifest.plans.find(p=>p.lessonId==='g8-t1-l08-008');const old=JSON.parse(fs.readFileSync('docs/contextual-teacher/owner-review/instructional-field-map.json'));
 for(const row of old.fields)assert.equal(binding.coverage.find(item=>item.path===row.path).valueSHA256,row.valueSHA256??row.sha256);
 assert.equal(binding.coverage.filter(row=>row.path.startsWith('enrichment.')).length,24);
});

test('a surviving portfolio container does not make a suppressed authored heading a valid insertion point',()=>{
 const binding=manifest.plans.find(p=>p.lessonId==='g8-t1-l20-020');const unit=units.find(u=>u.id===binding.lessonId);const hidden=unit.blocks[41].id;const intact=unit.blocks[49].id;
 assert.equal(unit.blocks[41].type,'activity');assert.ok(!teachingSource(unit,digest(unit)).sections.includes(hidden));
 const review=binding.moments.find(m=>m.id==='l20-stage-4');assert.equal(review.placement.blockId,intact);assert.ok(review.sourceBlockIds.includes(hidden));assert.match(review.placement.review,/suppresses Activity 27/);
 const html=renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:unit.blocks,unitId:unit.id,unitType:unit.type,promptResponses:{},onSavePromptResponse:()=>{}}));assert.ok(!html.includes('Activity 27:'));assert.ok(html.includes('Activity 28:'));
});

test('contextual delivery distinguishes multiple scrollable source tables without changing learner labels',()=>{
 const unit=units.find(u=>u.id==='g12-t1-l05-005');
 const props={blocks:unit.blocks,unitId:unit.id,unitType:unit.type,promptResponses:{},onSavePromptResponse:()=>{}};
 const learner=renderToStaticMarkup(React.createElement(ContentBlocks,props));
 const teacher=renderToStaticMarkup(React.createElement(ContentBlocks,{...props,sectionGuidance:()=>null}));
 const labels=[...teacher.matchAll(/aria-label="(Scrollable curriculum table[^"]*)"/g)].map(match=>match[1]);
 assert.ok(labels.length>1);assert.equal(new Set(labels).size,labels.length);
 assert.ok(learner.includes('aria-label="Scrollable curriculum table"'));
 assert.ok(!learner.includes('aria-label="Scrollable curriculum table 1"'));
});
