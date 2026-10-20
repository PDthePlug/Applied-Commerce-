import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
const ids=['g8-t1-l08-008','g9-t1-l02-002','g10-t2-l19-019','g11-t1-l14-014','g12-t1-l05-005'];
const dir='work/classroom/private/evidence';
test.beforeEach(async({page})=>{
 await page.route('**/*',route=>{const url=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(url.hostname)?route.continue():route.abort('blockedbyclient');});
 await page.route('**/api/preferences',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({preferences:{appearance:'system',accent:'commerce',textSize:'standard',readingWidth:'standard'}})}));
});
for(const id of ids)test(`${id}: guide, learner context, presentation, accessibility and print`,async({page},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
 const response=page.waitForResponse(r=>r.url().includes('/api/classroom?')&&r.status()===200);
 await page.goto(`/facilitator/classroom?lesson=${id}`);const payload=await(await response).json();
 await expect(page.getByRole('article',{name:'Draft teacher guide'})).toBeVisible();
 await expect(page.getByRole('heading',{level:2})).toHaveText(payload.selected.title);
 await expect(page.getByRole('combobox',{name:'Grade',exact:true})).toHaveValue(String(payload.selected.grade));
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
 const axe=await new AxeBuilder({page}).include('.classroom-workspace').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);
 const scaffold=page.getByRole('region',{name:'Practical work scaffold'});await scaffold.focus();await expect(scaffold).toBeFocused();
 if(info.project.use.viewport.width<500){const before=await scaffold.evaluate(el=>el.scrollLeft);await page.keyboard.press('ArrowRight');await expect.poll(()=>scaffold.evaluate(el=>el.scrollLeft)).toBeGreaterThan(before);}
 await fs.mkdir(dir,{recursive:true});await page.screenshot({path:`${dir}/${id}-${info.project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Presentation prompts'}).click();await expect(page.getByRole('article',{name:'Draft teacher guide'})).toHaveCount(0);
 await expect(page.getByRole('region',{name:'Learner-facing classroom prompts'})).toBeVisible();
 await expect(page.locator('body')).not.toContainText(payload.guide.understandingChecks[0].secureReasoning);
 const next=page.getByRole('button',{name:'Next stage'});await next.focus();await page.keyboard.press('Enter');await expect(page.locator('.classroom-presentation h3')).toBeFocused();await expect(page.locator('.classroom-presentation')).toContainText('Stage 2 of');
 if(payload.guide.periods.length===2){await page.getByRole('combobox',{name:'Period',exact:true}).selectOption('1');await expect(page.locator('.classroom-presentation')).toContainText('Stage 1 of');}
 await page.getByRole('button',{name:'Return to teacher guide'}).click();await expect(page.getByRole('button',{name:'Presentation prompts'})).toBeFocused();
 await page.emulateMedia({media:'print'});await expect(page.locator('.classroom-catalog')).toBeHidden();await expect(page.getByRole('heading',{name:'Checks of understanding'})).toBeVisible();
 if(info.project.name==='classroom-1280')await page.pdf({path:`${dir}/${id}.pdf`,format:'A4',printBackground:true,margin:{top:'12mm',bottom:'12mm',left:'12mm',right:'12mm'}});
 await page.emulateMedia({media:'screen'});await page.getByRole('link',{name:'Open learner lesson'}).click();await expect(page).toHaveURL(new RegExp(`${id}\\?classroom=1`));await expect(page.getByRole('link',{name:'Back to teacher guidance'})).toHaveAttribute('href',`/facilitator/classroom?lesson=${id}`);
 await page.getByRole('link',{name:'Back to teacher guidance'}).click();await expect(page.getByRole('combobox',{name:'Lesson',exact:true})).toHaveValue(id);
 expect(errors).toEqual([]);
});
test('catalogue, unavailable guide, error recovery and account changes',async({page})=>{
 await page.goto('/facilitator/classroom');await expect(page.getByRole('article')).toBeVisible();
 await page.getByRole('combobox',{name:'Grade',exact:true}).selectOption('12');await expect(page.getByRole('combobox',{name:'Lesson',exact:true})).toHaveValue(ids[4]);
 await page.getByRole('combobox',{name:'Term',exact:true}).selectOption('4');await expect(page.getByRole('heading',{name:'This classroom guide has not been developed yet.'})).toBeVisible();
 await page.goBack();await expect(page.getByRole('article')).toBeVisible();
 await page.route('**/api/classroom?*',route=>route.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'Synthetic revoked educator assignment.'})}));
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.getByRole('heading',{name:'Teacher access is not assigned.'})).toBeVisible();await expect(page.getByRole('article')).toHaveCount(0);
 await page.unroute('**/api/classroom?*');await page.getByRole('button',{name:'Try again'}).click();await expect(page.getByRole('article')).toBeVisible();
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('classroom-fixture-auth',{detail:'guest'})));await expect(page.getByRole('heading',{name:'Sign in to open teacher guidance.'})).toBeVisible();await expect(page.getByRole('article')).toHaveCount(0);
 let pending;
 await page.route('**/api/classroom?*',route=>{pending=route;});
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('classroom-fixture-auth',{detail:'classroom-fixture-teacher'})));
 await expect(page.getByRole('status').filter({hasText:'Loading authorised teaching guidance…'})).toBeVisible();await expect(page.getByRole('article')).toHaveCount(0);
 await expect.poll(()=>Boolean(pending)).toBeTruthy();await pending.fulfill({status:403,contentType:'application/json',body:JSON.stringify({error:'Synthetic revoked assignment after signing in again.'})});
 await expect(page.getByRole('heading',{name:'Teacher access is not assigned.'})).toBeVisible();await expect(page.getByRole('article')).toHaveCount(0);
 expect(await page.evaluate(()=>Object.keys(localStorage).some(key=>/classroom.*guide/i.test(key)))).toBeFalsy();
});
test('dark appearance and 200% text remain usable',async({page},info)=>{
 await page.emulateMedia({colorScheme:'dark'});await page.goto('/facilitator/classroom');await expect(page.getByRole('article')).toBeVisible();
 await page.evaluate(()=>{document.documentElement.dataset.acAppearance='dark';});
 await page.addStyleTag({content:'.classroom-workspace :is(p,li,dd){font-size:32px!important}'});
 const axe=await new AxeBuilder({page}).include('.classroom-workspace').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();await fs.mkdir(dir,{recursive:true});await page.screenshot({path:`${dir}/dark-${info.project.name}.png`,fullPage:true});
});
