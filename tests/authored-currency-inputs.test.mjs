import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {runtimeUnits} from '../scripts/semantic-census.mjs';
import {digest} from '../scripts/classroom-inventory.mjs';
import {renderModule} from './lib/render-module.mjs';
const {ContentBlocks}=await import(renderModule('components/content-blocks.tsx'));
const {persistResponseKey}=await import(renderModule('lib/response-identity.ts'));
const units=await runtimeUnits();
const repairs=JSON.parse(fs.readFileSync('tests/fixtures/authored-currency-input-repairs.json')).units;
const render=(unit,promptResponses={},extra={})=>renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:unit.blocks,unitId:unit.id,unitType:unit.type,promptResponses,onSavePromptResponse:()=>{},...extra}));

test('all 62 existing Grade 12 amount and allocation blanks accept their own stable saved answer',()=>{
 let count=0;
 for(const repair of repairs){
  const unit=units.find(u=>u.id===repair.lessonId),before=digest(unit),responses={};
  for(const table of repair.tables){
   const index=unit.blocks.findIndex(b=>b.id===table.blockId),block=unit.blocks[index];
   assert.equal(block.type,'table');
   for(const cell of table.cells){
    assert.equal(block.rows[cell.row][cell.column],cell.marker,'Only original unit markers are repaired');
    const key=unit.id+'::prompt-'+block.id+`::table-${cell.row}-${cell.column}`;
    assert.equal(persistResponseKey(unit.id,unit.blocks,unit.id+`::block-${index}::table-${cell.row}-${cell.column}`),key);
    responses[key]='SYNTHETIC_AUTHORED_AMOUNT_'+count++;
   }
  }
  const html=render(unit,responses),textareas=[...html.matchAll(/<textarea\b[^>]*>([^]*?)<\/textarea>/g)].map(m=>m[1]);
  for(const value of Object.values(responses))assert.equal(textareas.filter(text=>text===value).length,1,'Each authored cell has one independent control');
  assert.equal(digest(unit),before,'Source and block identities remain unchanged');
 }
 assert.equal(count,62);
});

test('existing table answers survive beside repaired currency cells in learner and teacher views',()=>{
 const unit=units.find(u=>u.id==='g12-t1-l08-008'),table=repairs.find(r=>r.lessonId===unit.id).tables[0],block=unit.blocks.find(b=>b.id===table.blockId);
 const oldKey=unit.id+'::prompt-'+block.id+'::table-1-0',amountKey=unit.id+'::prompt-'+block.id+'::table-1-2';
 assert.equal(block.rows[1][0],'');assert.equal(block.rows[1][2],'R');
 const values={[oldKey]:'SYNTHETIC_EXISTING_FUND',[amountKey]:'SYNTHETIC_RESEARCHED_AMOUNT'};
 for(const extra of [{},{sectionGuidance:()=>null}]){
  const html=render(unit,values,extra);
  for(const value of Object.values(values))assert.match(html,new RegExp('<textarea\\b[^>]*>'+value+'<\\/textarea>'));
  assert.match(html,/\(rand\)/);assert.match(html,/<div class="authored-amount-cell"><span aria-hidden="true">R<\/span><textarea/);
 }
});

test('the original worked example remains read-only and percentage/deduction units stay explicit',()=>{
 const example=units.find(u=>u.id==='g9-t2-l25-026'),index=example.blocks.findIndex(b=>b.id==='291880c52925d6231737ea15-1');assert.ok(index>=0);
 const tableIndex=example.blocks.slice(0,index).filter(b=>b.type==='table').length,tables=render(example).match(/<table>[^]*?<\/table>/g);
 assert.ok(!/<textarea|<input|<select/.test(tables[tableIndex]),'Do not turn a worked example into new learner fields');
 const budget=render(units.find(u=>u.id==='g12-t1-l12-012'));assert.match(budget,/\(rand, deduction\)/);assert.match(budget,/<span aria-hidden="true">-R<\/span>/);
 const pairedBudget=render(units.find(u=>u.id==='g12-t1-l15-015'));assert.match(pairedBudget,/aria-label="Income — Amount — Entry 1 \(rand\)"/);assert.match(pairedBudget,/aria-label="Rent — Expenses — Amount \(rand\)"/);
 const allocation=render(units.find(u=>u.id==='g12-t3-l46-046'));assert.match(allocation,/\(percent\)/);assert.match(allocation,/<span aria-hidden="true">%<\/span>/);
});
