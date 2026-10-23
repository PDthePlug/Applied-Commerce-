import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {spawnSync} from 'node:child_process';
import {runtimeUnits} from '../scripts/semantic-census.mjs';import {renderModule} from './lib/render-module.mjs';
const {ContentBlocks}=await import(renderModule('components/content-blocks.tsx'));
const {contextualAlignment,contextualPlacements}=await import(renderModule('lib/classroom/contextual.ts'));
const units=await runtimeUnits();const unit=units.find(u=>u.id==='g8-t1-l08-008');
const manifest=JSON.parse(fs.readFileSync('content/instructional/benchmark-manifest.v1.json')).guides.find(g=>g.lessonId===unit.id);
const structuralGuide={...manifest,periods:manifest.periods.map(p=>({...p,stages:contextualPlacements.map((s,i)=>({id:s.stageId,minutes:p.stageMinutes[i],sourceBlockIds:manifest.sourceReferences.map(r=>r.blockId)}))}))};
test('five teaching stages use real semantic boundaries without changing source order or learner identities',()=>{
 const before=JSON.stringify(unit);const placements=contextualAlignment(unit,structuralGuide);
 assert.deepEqual(placements.map(s=>[s.start,s.end]),[[0,5],[5,14],[14,24],[24,40],[40,45]]);
 assert.equal(placements[0].sectionAnchor,placements[2].sectionAnchor,'opening and discussion revisit the same grouped examples');
 assert.deepEqual(placements.map(p=>p.edge),['before','before','after','before','before']);
 assert.equal(JSON.stringify(unit),before);
 const html=renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:unit.blocks,unitId:unit.id,promptResponses:{},onSavePromptResponse:()=>{},sectionGuidance:(section,edge)=>placements.filter(p=>p.sectionAnchor===section.anchor&&p.edge===edge).map(p=>React.createElement('aside',{key:p.stageId,'data-contextual-test':p.stageId},p.title))}));
 for(const p of placements)assert.ok(html.includes(`data-contextual-test="${p.stageId}"`));
 assert.ok(!/<ul[^>]*>\s*<aside/.test(html),'interventions do not split grouped lists');
});
test('an unrelated lesson, changed stage timing, missing source reference or non-boundary placement fails closed',()=>{
 assert.throws(()=>contextualAlignment(units.find(u=>u.id==='g8-t1-l09-009'),structuralGuide));
 const changed=structuredClone(structuralGuide);changed.periods[0].stages[0].minutes=6;assert.throws(()=>contextualAlignment(unit,changed));
 const missing=structuredClone(unit);missing.blocks=missing.blocks.filter(b=>b.id!=='c9786145cf517bdd5a05c00d-1');assert.throws(()=>contextualAlignment(missing,structuralGuide));
 const ungrouped=structuredClone(unit);ungrouped.blocks.find(b=>b.id==='c9786145cf517bdd5a05c00d-1').type='paragraph';assert.throws(()=>contextualAlignment(ungrouped,structuralGuide));
});
test('all 399 learner units retain the exact main-branch renderer markup without teacher interventions',()=>{
 const baseline=JSON.parse(fs.readFileSync('tests/fixtures/learner-renderer-main.json'));
 assert.equal(baseline.baseCommit,'c8704e36f3a6a688486c6f78df723f4925a5eea3');assert.equal(baseline.units.length,399);
 for(const unit of units){const html=renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:unit.blocks,unitId:unit.id,unitType:unit.type,promptResponses:{},onSavePromptResponse:()=>{}}));assert.equal(crypto.createHash('sha256').update(html).digest('hex'),baseline.units.find(row=>row.id===unit.id).sha256,unit.id);}
});
test('hosted release verification fails closed without exposing a missing or invalid Secret',()=>{
 for(const key of ['', 'SYNTHETIC_INVALID_KEY_SENTINEL']){
  const result=spawnSync(process.execPath,['scripts/verify-classroom-hosted.mjs'],{env:{...process.env,AC_CLASSROOM_CONTENT_KEY:key},encoding:'utf8'});
  assert.equal(result.status,1);assert.ok(!result.stdout.includes('classroomServerBuildVerification'));assert.ok(!(result.stdout+result.stderr).includes('SYNTHETIC_INVALID_KEY_SENTINEL'));
 }
});

const {instructionalFields,instructionalLocation,validateContextualEnrichment}=await import(renderModule('lib/classroom/contextual-fields.ts'));
test('all 100 original instructional paths have explicit live contextual ownership, with unknown fields rejected',()=>{
 const map=JSON.parse(fs.readFileSync('docs/contextual-teacher/owner-review/instructional-field-map.json'));
 const synthetic={};
 for(const row of map.fields){const keys=row.path.split('.');let cursor=synthetic;for(const key of keys.slice(0,-1))cursor=cursor[key]??= {};cursor[keys.at(-1)]=`SYNTHETIC_${row.path}`;assert.equal(instructionalLocation(row.path),row.location);}
 const fields=instructionalFields(synthetic);assert.equal(fields.length,100);assert.equal(new Set(fields.map(f=>f.path)).size,100);
 assert.deepEqual(fields.reduce((counts,f)=>({...counts,[f.location]:(counts[f.location]??0)+1}),{}),{preparation:17,'g8-explore':15,'g8-discuss':18,'g8-open':7,'g8-do':26,'g8-check':13,independent:4});
 assert.throws(()=>instructionalFields({...synthetic,unreviewedTeachingDetail:'Requires an explicit placement'}));
 assert.throws(()=>validateContextualEnrichment(null,synthetic));
 assert.throws(()=>validateContextualEnrichment({schemaVersion:1,lessonId:unit.id,version:'changed'},synthetic));
});
test('local annotations use real rendered Part headings and cannot silently attach to changed activity grouping',()=>{
 const changed=structuredClone(unit);changed.blocks.find(b=>b.id==='6d36aadb38b15408df733b24-1').text='Changed activity grouping';assert.throws(()=>contextualAlignment(changed,structuralGuide));
 const regrouped=structuredClone(unit);regrouped.blocks.find(b=>b.id==='6d36aadb38b15408df733b24-1').type='list';assert.throws(()=>contextualAlignment(regrouped,structuralGuide));
 const html=renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:unit.blocks,unitId:unit.id,promptResponses:{},onSavePromptResponse:()=>{},partGuidance:block=>['6d36aadb38b15408df733b24-1','616f175c1669b5b75b907def-1'].includes(block.id)?React.createElement('aside',{'data-part-placement':block.id},'SYNTHETIC_SCOPE'):null}));
 assert.match(html,/data-part-placement="6d36aadb38b15408df733b24-1"[^]*?<\/aside><h3 class="module-part-heading">Part B:/);
 assert.match(html,/data-part-placement="616f175c1669b5b75b907def-1"[^]*?<\/aside><h3 class="module-part-heading">Part C:/);
});
test('every visible authored Grade 8 activity has a current, independent or later-work disposition without changing source order',()=>{
 const map=JSON.parse(fs.readFileSync('docs/contextual-teacher/owner-review/activity-routing.json'));
 assert.deepEqual(map.groups.flatMap(g=>g.sourceBlockIds),unit.blocks.slice(0,50).map(b=>b.id));
 assert.equal(map.visibleSourceBlocksMapped,50);
 assert.match(map.groups.find(g=>g.guidance==='partB').schedule,/Later/);
 assert.match(map.groups.find(g=>g.authoredMaterial==='Checkpoint Question 3').schedule,/Later/);
 assert.match(map.groups.find(g=>g.guidance==='deepening').schedule,/Optional independent/);
});
