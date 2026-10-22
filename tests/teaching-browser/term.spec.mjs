import {test,expect} from '@playwright/test';import fs from 'node:fs/promises';import AxeBuilder from '@axe-core/playwright';
const manifest=JSON.parse(await fs.readFile('content/instructional/teaching-manifest.v2.json','utf8'));
const folder='work/classroom-v2/private/evidence';
const state=()=>JSON.parse(localStorage.getItem('applied-commerce-learning-state-v1:user:classroom-fixture-teacher')??'{}');
test.beforeEach(async({context})=>{
 await context.route('**/*',route=>['127.0.0.1','localhost'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort('blockedbyclient'));
 await context.route('**/api/preferences',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{appearance:'system',accent:'commerce',textSize:'standard',readingWidth:'standard'}})}));
});
for(const binding of manifest.plans)test(`${binding.lessonId} · complete local guidance, sequence, learner work and print`,async({page},info)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const response=page.waitForResponse(r=>r.url().includes('/api/classroom?')&&r.status()===200);
 const href=`/learn/${binding.grade}/term/${binding.term}/${binding.lessonId}`;
 await page.goto(href);const payload=await(await response).json();const plan=payload.plan;
 expect(plan.lessonId).toBe(binding.lessonId);expect(Object.keys(plan.fields).length).toBe(binding.fieldCount);
 await expect(page.locator('.semantic-learning-document')).toBeVisible();
 // Retain an original stable field value before entering Teacher View.
 const answer=page.locator('.semantic-learning-document textarea').first();let answerId;
 if(await answer.count()){answerId=await answer.getAttribute('id');await answer.fill('Existing learner response '+binding.lessonId);await expect(answer).toHaveValue('Existing learner response '+binding.lessonId);}
 const before=await page.evaluate(state);
 await page.getByRole('button',{name:'Teacher View',exact:true}).click();await expect(page.locator('[data-teaching-stage]')).toHaveCount(plan.moments.filter(m=>m.schedule==='classroom').length);
 await expect(page.locator('.contextual-print-guide')).toHaveCount(0);await expect(page.getByRole('textbox',{name:'Lesson notes',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Complete and continue',exact:true})).toHaveCount(0);
 await expect(page.locator('.contextual-preparation>details').first()).not.toHaveAttribute('open');
 const nav=page.getByRole('navigation',{name:'Classroom teaching stages'});const select=nav.getByRole('combobox');
 for(const moment of plan.moments){
  const panel=page.locator(`[data-instructional-location="${moment.id}"]`);await expect(panel).toHaveCount(1);await expect(panel).not.toHaveAttribute('open');
  expect(await panel.getAttribute('data-source-placement')).toBe(moment.placement.blockId);
  if(moment.placement.kind==='section')expect(await panel.evaluate(el=>el.parentElement.id)).toBe('learning-'+moment.placement.blockId);
  const summary=panel.locator('summary').first();await summary.focus();await page.keyboard.press('Enter');await expect(panel).toHaveAttribute('open','');await summary.focus();await page.keyboard.press('Space');await expect(panel).not.toHaveAttribute('open');
  expect((await summary.boundingBox()).height).toBeGreaterThanOrEqual(44);
  if(moment.schedule==='classroom'){await select.selectOption(moment.id);await nav.getByRole('button',{name:'Go to stage'}).click();await expect(page.locator('#teacher-moment-'+moment.id)).toBeFocused();}
 }
 const originalState=await page.evaluate(state);expect(originalState).toEqual(before);
 const first=plan.periods[0].moments[0];await select.selectOption(first);await nav.getByRole('button',{name:'Go to stage'}).click();
 await fs.mkdir(folder,{recursive:true});
 await page.screenshot({path:`${folder}/${binding.lessonId}-${info.project.name}-collapsed.png`});
 const panel=page.locator(`[data-instructional-location="${first}"]`);await panel.locator('summary').first().click();await page.screenshot({path:`${folder}/${binding.lessonId}-${info.project.name}-expanded.png`});
 const overflow=await page.evaluate(()=>({page:document.documentElement.scrollWidth>innerWidth+1,nested:[...document.querySelectorAll('.contextual-private')].filter(el=>['auto','scroll'].includes(getComputedStyle(el).overflowY)&&el.scrollHeight>el.clientHeight+1).length,font:getComputedStyle(document.querySelector('.contextual-private')).fontSize}));expect(overflow).toEqual({page:false,nested:0,font:'15px'});
 // Native disclosures make every private field locally accessible, with no
 // print tree or unrelated full guide mounted in the live teaching flow.
 await page.locator('.contextual-private details,details.contextual-guidance').evaluateAll(els=>els.forEach(el=>el.open=true));
 const rendered=await page.locator('[data-instructional-field]').evaluateAll(els=>els.map(el=>({path:el.dataset.instructionalField,text:el.textContent,visible:el.getClientRects().length>0})));
 for(const [path,value]of Object.entries(plan.fields)){const hits=rendered.filter(row=>row.path===path);expect(hits.length,'Local field '+path).toBeGreaterThan(0);expect(hits.some(row=>row.visible&&row.text===value),'Visible preserved field '+path).toBeTruthy();}
 const live=await page.locator('.contextual-private').allTextContents();expect(live.join(' ')).not.toMatch(/sourceBlockIds|Quality self-review|reviewedBy|[a-f0-9]{24}-\d/);
 if(info.project.use.viewport.width===1280){
  const axe=await new AxeBuilder({page}).include('.lesson-document').analyze();expect(axe.violations.map(v=>v.id)).toEqual([]);
  await page.evaluate(()=>window.print=()=>{});await page.getByRole('button',{name:'Print complete teacher preparation',exact:true}).click();const print=page.locator('.contextual-print-guide');await expect(print).toHaveCount(1);
  const printFields=await print.locator('[data-instructional-field]').evaluateAll(els=>els.map(el=>el.dataset.instructionalField));for(const path of Object.keys(plan.fields))expect(printFields).toContain(path);
  await page.emulateMedia({media:'print'});await page.pdf({path:`${folder}/${binding.lessonId}-complete.pdf`,format:'A4',printBackground:true});await page.emulateMedia({media:'screen'});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));await expect(print).toHaveCount(0);
 }
 await page.getByRole('button',{name:'Learner View',exact:true}).click();await expect(page.locator('.contextual-guidance')).toHaveCount(0);
 if(answerId){await expect(page.locator('[id='+JSON.stringify(answerId)+']')).toHaveValue('Existing learner response '+binding.lessonId);await page.reload();await expect(page.locator('[id='+JSON.stringify(answerId)+']')).toHaveValue('Existing learner response '+binding.lessonId);}
 expect(errors).toEqual([]);
});

test('private state clears on account change, sign-out, lesson change and revoked revalidation; projection contains no guidance',async({page,context})=>{
 const href='/learn/8/term/1/g8-t1-l08-008';await page.goto(href);await page.getByRole('button',{name:'Teacher View',exact:true}).click();await expect(page.locator('[data-teaching-stage]')).toHaveCount(5);
 await page.locator('.contextual-tools>summary').click();const popupPromise=context.waitForEvent('page');await page.getByRole('link',{name:'Open learner presentation in a new window'}).click();const popup=await popupPromise;await popup.waitForLoadState();await expect(popup.locator('.semantic-learning-document')).toBeVisible();await expect(popup.locator('.contextual-private')).toHaveCount(0);expect(await popup.locator('.learner-projection textarea').evaluateAll(els=>els.every(el=>el.matches(':disabled')&&el.value===''))).toBeTruthy();await popup.close();
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('classroom-fixture-auth',{detail:'another-account'})));await expect(page.locator('.contextual-guidance')).toHaveCount(0);await expect(page.getByRole('button',{name:'Teacher View',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Teacher View',exact:true}).click();await expect(page.locator('[data-teaching-stage]')).toHaveCount(5);await page.evaluate(()=>window.dispatchEvent(new CustomEvent('classroom-fixture-auth',{detail:'guest'})));await expect(page.locator('.contextual-private')).toHaveCount(0);
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('classroom-fixture-auth',{detail:'classroom-fixture-teacher'})));await page.getByRole('button',{name:'Teacher View',exact:true}).click();await expect(page.locator('[data-teaching-stage]')).toHaveCount(5);
 await page.route('**/api/classroom?**',route=>route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'Fixture revoked access'})}));await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('.contextual-guidance')).toHaveCount(0);await expect(page.getByRole('alert').filter({hasText:'Fixture revoked access'})).toContainText('Fixture revoked access');
 const raw=await page.evaluate(()=>Object.values(localStorage).join(' '));expect(raw).not.toMatch(/secureReasoning|indicativeReasoning|enrichment\.distinction/);
 await page.unroute('**/api/classroom?**');await page.goto('/learn/8/term/1/g8-t1-l09-009');await expect(page.locator('.contextual-guidance')).toHaveCount(0);
});
