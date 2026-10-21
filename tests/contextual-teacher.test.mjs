import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';
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
 assert.equal(baseline.baseCommit,'3933c2d90519e7aa53984405693da9526c12a588');assert.equal(baseline.units.length,399);
 for(const unit of units){const html=renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:unit.blocks,unitId:unit.id,unitType:unit.type,promptResponses:{},onSavePromptResponse:()=>{}}));assert.equal(crypto.createHash('sha256').update(html).digest('hex'),baseline.units.find(row=>row.id===unit.id).sha256,unit.id);}
});
