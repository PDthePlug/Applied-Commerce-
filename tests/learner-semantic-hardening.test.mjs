import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {runtimeUnits} from '../scripts/semantic-census.mjs';import {renderModule} from './lib/render-module.mjs';
const {ContentBlocks}=await import(renderModule('components/content-blocks.tsx'));
const {responseView,persistResponseKey}=await import(renderModule('lib/response-identity.ts'));
const {definitionForResponse}=await import(renderModule('lib/evidence/engine.ts'));
const {responsesForPortfolio,buildPortfolioDefinitions}=await import(renderModule('lib/portfolio-model.ts'));
const {sourceSelection}=await import(renderModule('lib/source-selections.ts'));
const units=await runtimeUnits();const wraps=JSON.parse(fs.readFileSync('lib/lesson-wraps/registry.json'));
const unit=(g,n)=>units.find(u=>u.grade===g&&u.startLesson===n&&u.type==='lesson');
const key=(u,i,slot)=>u.id+'::prompt-'+u.blocks[i].id+'::'+slot;
const render=(u,responses={},extra={})=>renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:u.blocks,unitId:u.id,unitType:u.type,promptResponses:responses,onSavePromptResponse:()=>{},...extra}));

test('395 unique source-specific wraps preserve source hashes, authored closing controls and exclude assessments',()=>{
 assert.equal(Object.keys(wraps).length,395);assert.equal(new Set(Object.values(wraps).map(w=>JSON.stringify(w.takeaways))).size,395);
 for(const u of units){const html=render(u);if(u.type==='assessment'){assert.ok(!html.includes('class="lesson-wrap"'));continue;}
  const w=wraps[u.id];assert.equal(w.takeaways.length,2);assert.equal(crypto.createHash('sha256').update(JSON.stringify(u)).digest('hex'),w.sourceSHA256,u.id);
  assert.ok(w.sourceRefs.every(id=>u.blocks.some(b=>b.id===id)),u.id);assert.equal((html.match(/id="lesson-wrap-title"/g)??[]).length,1,u.id);
  assert.ok(!/lesson-wrap-synthesis[^]*?<textarea/.test(html.split('lesson-wrap-authored')[0].split('lesson-wrap-next')[0]),u.id);
  if(w.authoredHeadingId){const closing=u.blocks.slice(u.blocks.findIndex(b=>b.id===w.authoredHeadingId)+1);for(const b of closing.filter(b=>b.kind==='text'&&b.text.startsWith('☐')))assert.ok(html.includes(b.text.slice(2).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#x27;')),u.id);}
 }
});

test('ability answers and compact confidence marks have independent durable identities and readable unscored educator evidence',()=>{
 const u=unit(8,3),answers={};for(let i=35;i<=44;i++){answers[key(u,i,'blank-0')]='Ability '+i;answers[key(u,i,'annotation-confidence')]=i%2?'believe':'unsure';}
 const html=render(u,answers);assert.equal((html.match(/class="confidence-marker-buttons"/g)??[]).length,10);assert.equal((html.match(/id="ability-marker-legend"/g)??[]).length,1);assert.equal((html.match(/aria-pressed="true"/g)??[]).length,10);
 for(let i=35;i<=44;i++){assert.ok(html.includes('value="Ability '+i+'"'));assert.notEqual(key(u,i,'blank-0'),key(u,i,'annotation-confidence'));const d=definitionForResponse(u,key(u,i,'annotation-confidence'),new Set());assert.equal(d.assessmentMode,'unscored');assert.match(d.prompt,/Confidence marker/);}
 const entries=buildPortfolioDefinitions(u).flatMap(d=>responsesForPortfolio(u,d,answers));assert.ok(entries.some(e=>e.value==='⭐ — A statement I genuinely believe'));assert.ok(entries.some(e=>e.value==='❓ — A statement I am unsure about'));
 const moved=[{kind:'text',type:'paragraph',id:'inserted',text:'Explanation'},...u.blocks];for(let i=35;i<=44;i++){const v=responseView(u.id,moved,answers);assert.equal(v[u.id+'::block-'+(i+1)+'::annotation-confidence'],answers[key(u,i,'annotation-confidence')]);assert.equal(persistResponseKey(u.id,moved,u.id+'::block-'+(i+1)+'::blank-0'),key(u,i,'blank-0'));}
});

test('external-validation instructions keep earlier combined evidence without a redundant editable input',()=>{
 const u=unit(8,3),html=render(u,{[key(u,50,'response')]:'Historical combined evidence',[key(u,51,'blank-0')]:'Observed skill',[key(u,52,'blank-0')]:'Missing skill'});
 assert.ok(html.includes('Historical combined evidence'));assert.ok(!html.includes('id="'+u.id+'::block-50::response"'));assert.ok(html.includes('value="Observed skill"'));assert.ok(html.includes('value="Missing skill"'));
});

test('all 383 deeper sections are collapsed and preserve source distinctions and actual reflections',()=>{
 let panels=0;for(const u of units){const html=render(u);panels+=(html.match(/class="deepening-insight"/g)??[]).length;assert.ok(!/<details class="deepening-insight"[^>]*\bopen/.test(html));}
 assert.equal(panels,383);
 const u=unit(8,16),html=render(u,{[key(u,45,'response-0')]:'A small problem',[key(u,45,'response-1')]:'One small step',[key(u,45,'response')]:'Previous explanation'});assert.ok(html.includes('A small problem'));assert.ok(html.includes('One small step'));assert.ok(html.includes('Previous explanation'));
 const g9=render(unit(9,1));for(const text of ['The Deeper Look','The Truth:','The Danger:','Your Move:'])assert.ok(g9.includes(text));
 assert.ok(render(unit(11,2)).includes('The Architect'));assert.ok(render(unit(12,5)).includes('The Launcher'));
});

test('source selections read stable prior-answer identities after insertion and keep existing destinations',()=>{
 const u=unit(8,9),saved={[key(u,16,'numbered')]:'School shoes'},inserted=[{id:'explanation',kind:'text',type:'paragraph',text:'Read'},...u.blocks];
 const spec=sourceSelection(u.id,inserted,28,responseView(u.id,inserted,saved));assert.deepEqual(spec.options,['School shoes']);assert.equal(spec.slot,'blank-0');
});

test('teacher interventions retain their original section and heading anchors in every grade',()=>{
 for(const u of units.filter(u=>u.type==='lesson')){
  const html=render(u,{}, {sectionGuidance:(s,edge)=>React.createElement('aside',{'data-teacher-anchor':s.anchor+'-'+edge},'SYNTHETIC_GUIDANCE')});
  for(const b of u.blocks.filter(b=>b.kind==='text'&&b.type==='section'&&/^(?:Deepening Insight|The Deeper Look|Truth \/ Danger)/.test(b.text)))assert.ok(html.includes('data-teacher-anchor="learning-'+b.id+'-before"'),u.id);
 }
});

test('instruction-only trailing parts retire visibly without changing any earlier part key or hiding historical text',()=>{
 const u=unit(8,16),values=Object.fromEntries([0,1,2,3].map(i=>[key(u,57,'response-'+i),'SYNTHETIC_PART_'+i]));const html=render(u,values);
 for(let i=0;i<4;i++)assert.ok(html.includes('SYNTHETIC_PART_'+i));
 assert.ok(!html.includes('id="'+u.id+'::block-57::response-3"'));for(let i=0;i<3;i++)assert.ok(html.includes('id="'+u.id+'::block-57::response-'+i+'"')||html.includes('value="SYNTHETIC_PART_'+i+'"'));
 assert.ok(html.includes('Write honestly.'));
});

test('checkpoint blanks use their existing keys under continuous questions and combined group evidence remains recoverable',()=>{
 const u=unit(8,16),html=render(u,{[key(u,48,'blank-0')]:'SYNTHETIC_OLD_CHECKPOINT_COMBINED',[key(u,49,'blank-0')]:'SYNTHETIC_REASON',[key(u,50,'blank-0')]:'SYNTHETIC_RESPONSE'});
 assert.ok(html.includes('SYNTHETIC_OLD_CHECKPOINT_COMBINED'));assert.ok(!html.includes('id="'+u.id+'::block-48::blank-0"'));
 for(const [i,value]of[[49,'SYNTHETIC_REASON'],[50,'SYNTHETIC_RESPONSE']]){assert.ok(html.includes('id="'+u.id+'::block-'+i+'::blank-0"'));assert.ok(html.includes(value));}
 const prove=html.match(/class="learning-section learning-mode-prove"[^]*?(?=<section class="learning-section|<section class="lesson-wrap")/)[0];const numbers=[...prove.matchAll(/class="structured-part-label">(\d+)\./g)].map(m=>Number(m[1]));assert.deepEqual(numbers,Array.from({length:numbers.length},(_,i)=>i+1));
});
