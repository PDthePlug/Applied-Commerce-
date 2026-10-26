import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {renderModule} from './lib/render-module.mjs';
import {runtimeUnits} from '../scripts/semantic-census.mjs';

const h=await import(renderModule('lib/horizon-response.ts'));
const {responseView,persistResponseKey}=await import(renderModule('lib/response-identity.ts'));
const {responsesForPortfolio,buildPortfolioDefinitions}=await import(renderModule('lib/portfolio-model.ts'));
const {buildEvidenceRecords}=await import(renderModule('lib/evidence/engine.ts'));
const {ContentBlocks}=await import(renderModule('components/content-blocks.tsx'));
const unit=(await runtimeUnits()).find(u=>u.id==='g10-t4-l60-060');
const block=unit.blocks.find(b=>h.horizonResponseKey.includes(`::prompt-${b.id}::`));
const index=unit.blocks.indexOf(block);

test('repair recognises only the complete authored four-horizon sequence without changing it',()=>{
  const original=JSON.stringify(unit);
  assert.equal(h.isFinancialHorizonPrompt(block.text),true);
  assert.equal(h.isFinancialHorizonPrompt(block.text.replace('40 years:','50 years:')),false);
  assert.equal(h.isFinancialHorizonPrompt(block.text+' Extra question'),false);
  assert.equal(JSON.stringify(unit),original);
});

test('each horizon is independent and clearing retains the exact previous combined answer',()=>{
  const legacy='Dependent\nAbundant 10 years:\nMy older note  ';
  let value=legacy;
  const choices=['Dependent','Stable','Secure','Independent'];
  h.financialHorizons.forEach((label,i)=>{value=h.changeHorizonResponse(value,label,choices[i]);});
  assert.deepEqual(h.readHorizonResponse(value),{answers:Object.fromEntries(h.financialHorizons.map((label,i)=>[label,choices[i]])),legacy});
  value=h.changeHorizonResponse(value,'Now','Surviving');
  assert.equal(h.readHorizonResponse(value).answers['10 years'],'Stable');
  for(const label of h.financialHorizons) value=h.changeHorizonResponse(value,label,'');
  assert.equal(value,legacy);
  assert.equal(h.changeHorizonResponse(h.changeHorizonResponse('','Now','Secure'),'Now',''),'');
});

test('unknown or malformed formats remain verbatim rather than being guessed or discarded',()=>{
  for(const value of ['  Dependent\nSurviving  ','{bad','{"kind":"ac_horizon_choices_v2","answers":{}}','{"kind":"ac_horizon_choices_v1","answers":{"Now":"Unknown"},"legacy":"old"}','{"kind":"ac_horizon_choices_v1","answers":{"50 years":"Stable"},"legacy":"old"}']){
    assert.deepEqual(h.readHorizonResponse(value),{answers:{},legacy:value});
    assert.equal(h.readHorizonResponse(h.changeHorizonResponse(value,'Now','Stable')).legacy,value);
  }
});

test('original stable identity and raw review fingerprints survive; portfolio shows readable evidence',()=>{
  const value=h.changeHorizonResponse('Dependent','20 years','Independent');
  const key=persistResponseKey(unit.id,unit.blocks,`${unit.id}::block-${index}::choice`);
  assert.equal(key,h.horizonResponseKey);
  const reordered=[{kind:'text',type:'paragraph',id:'inserted-test',text:'Explanation'},...unit.blocks];
  assert.equal(responseView(unit.id,reordered,{[key]:value})[`${unit.id}::block-${index+1}::choice`],value);
  const definition=buildPortfolioDefinitions(unit).find(d=>d.blockIndices.includes(index));
  const portfolio=responsesForPortfolio(unit,definition,{[key]:value});
  assert.equal(portfolio[0].value,'20 years: Independent\nPrevious combined response:\nDependent');
  assert.equal(buildEvidenceRecords(unit,{[key]:value})[0].responseValue,value,'review decisions still bind to the exact saved value');
  assert.equal(h.displayHorizonResponse('unrelated-key',value),value,'ordinary written JSON is not reformatted');
});

test('actual renderer presents four native radio groups and retains earlier text',()=>{
  const html=renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:unit.blocks,unitId:unit.id,promptResponses:{[h.horizonResponseKey]:'Dependent'},onSavePromptResponse:()=>{}}));
  assert.equal((html.match(/class="horizon-choice"/g)||[]).length,4);
  assert.equal((html.match(/type="radio"/g)||[]).length,24);
  assert.match(html,/Previous combined response/);
  assert.match(html,/cannot be matched to individual time horizons/);
  assert.doesNotMatch(html,/Clear Now selection/,'opening an older answer does not manufacture current selections');
});
