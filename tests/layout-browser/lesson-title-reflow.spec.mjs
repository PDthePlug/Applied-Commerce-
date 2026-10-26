// Local CSS/renderer regression, not genuine application authentication.
import fs from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {test,expect} from '@playwright/test';
import {runtimeUnits} from '../../scripts/semantic-census.mjs';
import {renderModule} from '../lib/render-module.mjs';

const {ContentBlocks}=await import(renderModule('components/content-blocks.tsx'));
const unit=(await runtimeUnits()).find(unit=>unit.id==='g9-t3-l39-028');
const styles=['foundation','reader','presentation','responsive','institutions','evidence','semantic-learning','auth','learner-record','personalisation','uiux-hardening','classroom','contextual-teacher'].map(name=>fs.readFileSync(`app/${name}.css`,'utf8')).join('\n');
const content=renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:unit.blocks,unitId:unit.id,promptResponses:{},onSavePromptResponse:()=>{},sectionGuidance:()=>null}));

test('long authored lesson titles reflow without clipping or changing workbook controls',async({page})=>{
 for(const width of [320,360,430,1280]){
  await page.setViewportSize({width,height:900});
  await page.setContent(`<style>${styles}</style><main class="app-shell focused-reader"><div class="reader-shell"><div class="reader-stage"><article class="lesson-document"><header class="lesson-heading"><h1>${unit.title}</h1></header>${content}</article></div></div></main>`);
  const heading=page.getByRole('heading',{level:1,name:unit.title,exact:true});
  const controls=await page.getByRole('textbox').count();
  const table=page.locator('.responsive-row-table').first();
  const headings=await table.locator('thead th').allTextContents();
  expect(headings).toHaveLength(4);
  for(const scale of [1,1.28,2]){
   await page.evaluate(scale=>document.documentElement.style.setProperty('--ac-text-scale',String(scale)),scale);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width+1);
   await expect(heading).toHaveText(unit.title);
   expect(await heading.evaluate(node=>node.scrollWidth<=node.clientWidth+1&&getComputedStyle(node).overflowX==='visible')).toBe(true);
   await expect(page.getByRole('textbox')).toHaveCount(controls);
   await expect(table.getByRole('columnheader')).toHaveCount(headings.length);
   expect(await table.locator('thead th').allTextContents()).toEqual(headings);
   await expect(table.locator('tbody tr').first()).toBeVisible();
  }
 }
 await page.emulateMedia({media:'print'});
 expect(await page.locator('.responsive-row-table thead').first().evaluate(node=>getComputedStyle(node).display)).toBe('table-header-group');
});
