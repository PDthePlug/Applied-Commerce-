// Local-only browser audit of the new controls; no cloud accounts or API mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const origin=process.env.AC_AUDIT_ORIGIN??'http://127.0.0.1:3100';
assert.match(origin,/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/);
const health=await fetch(origin+'/api/health');assert.equal(health.status,503);assert.equal((await health.json()).projectRef,null);
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']});
const rows=[];
try{
 const context=await browser.newContext();const page=await context.newPage();
 for(const width of[320,360,430,768,1280,1920])for(const appearance of['light','dark'])for(const path of['/learn/8/term/1/g8-t1-l03-003','/learn/8/term/1/g8-t1-l16-016','/learn/9/term/1/g9-t1-l07-007']){
  await page.setViewportSize({width,height:900});await page.goto(origin+path);await page.locator('.semantic-learning-document').waitFor();
  await page.evaluate(appearance=>{document.documentElement.dataset.acAppearance=appearance;document.documentElement.style.setProperty('--ac-text-scale','2');},appearance);
  if(await page.locator('.confidence-marker-buttons').count()){const button=page.locator('.confidence-marker-buttons button').first();await button.focus();if(await button.getAttribute('aria-pressed')==='true')await page.keyboard.press('Space');await page.keyboard.press('Space');assert.equal(await button.getAttribute('aria-pressed'),'true');const bounds=await button.boundingBox();assert.ok(bounds.width>=44&&bounds.height>=44);assert.ok(await button.getAttribute('aria-label'));assert.ok(await page.locator('.annotated-statement .fill-response-copy').first().evaluate(node=>parseFloat(getComputedStyle(node).fontSize))>=28,'Statement label must enlarge with answer text');}
  for(const panel of await page.locator('.deepening-insight').all())await panel.locator('summary').click();
  const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']).analyze();
  const violations=result.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));
  rows.push({path,width,appearance,textScale:2,violations});fs.writeFileSync('test-results/learner-hardening/accessibility.json',JSON.stringify({rows},null,2));console.log(JSON.stringify({path,width,appearance,violations:violations.length}));assert.deepEqual(violations,[],path+' '+width+' '+appearance);
 }
}finally{fs.mkdirSync('test-results/learner-hardening',{recursive:true});fs.writeFileSync('test-results/learner-hardening/accessibility.json',JSON.stringify({rows},null,2));await browser.close();}
console.log(JSON.stringify({scans:rows.length,violations:0}));
