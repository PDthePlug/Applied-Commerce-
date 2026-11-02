import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const origin=process.env.AC_AUDIT_ORIGIN??'http://127.0.0.1:3100';
assert.match(origin,/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/);
const health=await fetch(origin+'/api/health');assert.equal(health.status,503);assert.equal((await health.json()).projectRef,null);
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']});const rows=[];
try{
 for(const width of[320,360,430])for(const appearance of['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:true,hasTouch:true});const page=await context.newPage();
  await page.goto(origin+'/learn/8/term/1/g8-t1-l03-003');const row=page.locator('.annotated-statement').first();await row.waitFor();
  await page.evaluate(appearance=>document.documentElement.dataset.acAppearance=appearance,appearance);
  await row.getByRole('textbox').fill('SYNTHETIC_TOUCH_ABILITY');const star=row.getByRole('button').first(),question=row.getByRole('button').last();
  await star.tap();assert.equal(await star.getAttribute('aria-pressed'),'true');await question.tap();assert.equal(await star.getAttribute('aria-pressed'),'false');assert.equal(await question.getAttribute('aria-pressed'),'true');await question.tap();assert.equal(await question.getAttribute('aria-pressed'),'false');assert.equal(await row.getByRole('textbox').inputValue(),'SYNTHETIC_TOUCH_ABILITY');
  await page.reload();await row.waitFor();assert.equal(await row.getByRole('textbox').inputValue(),'SYNTHETIC_TOUCH_ABILITY');assert.equal(await star.getAttribute('aria-pressed'),'false');assert.equal(await question.getAttribute('aria-pressed'),'false');
  rows.push({width,appearance,hasTouch:true,selectChangeClearPreservesText:true,reloadRestoresUnmarked:true});await context.close();
 }
}finally{fs.mkdirSync('test-results/learner-hardening',{recursive:true});fs.writeFileSync('test-results/learner-hardening/touch.json',JSON.stringify({rows},null,2));await browser.close();}
console.log(JSON.stringify({journeys:rows.length,passed:rows.length}));
