import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {surfaceReady} from '../helpers/surface-ready.mjs';

const lesson='/learn/8/term/1/g8-t1-l01-001';

test('public learner, account and institution accessibility regressions',async({page},testInfo)=>{
  test.setTimeout(180_000);
  for(const path of ['/','/learn',lesson,'/profile','/settings','/auth','/institutions','/institutions/demo']){
    await page.goto(path);await surfaceReady(page,path);
    const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']).analyze();
    await testInfo.attach('accessibility '+path,{body:Buffer.from(JSON.stringify(result,null,2)),contentType:'application/json'});
    expect.soft(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),path).toEqual([]);
  }
});

for(const appearance of ['dark','system']){
  test(appearance+' keeps core reading, progress, portfolio and institutional demo accessible',async({page},testInfo)=>{
    test.setTimeout(180_000);
    await page.emulateMedia({colorScheme:'dark'});
    await page.addInitScript(appearance=>localStorage.setItem('applied-commerce:personalisation:v1:guest',JSON.stringify({appearance,accent:'commerce',textSize:'standard',readingWidth:'standard'})),appearance);
    for(const path of [lesson,'/progress','/portfolio','/institutions/demo']){
      await page.goto(path);await surfaceReady(page,path);
      const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']).analyze();
      await testInfo.attach(appearance+' '+path,{body:Buffer.from(JSON.stringify(result,null,2)),contentType:'application/json'});
      expect.soft(result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),appearance+' '+path).toEqual([]);
    }
  });
}
async function openLesson(page){
  await page.goto(lesson);
  await expect(page.locator('.lesson-heading h1')).toBeVisible();
}

test('institution demo learner action opens the curriculum',async({page})=>{
  await page.goto('/institutions/demo');
  await page.getByRole('link',{name:'Open learner platform',exact:true}).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('.grade-grid')).toBeVisible();
});

test('site icon resolves and header navigation offers a touch target',async({page})=>{
  await page.goto('/');
  const icon=await page.locator('link[rel="icon"]').first().getAttribute('href');
  expect(icon).toBeTruthy();
  const response=await page.request.get(icon);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('image/');
  const link=page.getByRole('link',{name:'Staff sign in',exact:true});
  const box=await link.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.width).toBeGreaterThanOrEqual(44);
});

test('reading preferences change actual lesson text size and measure',async({page})=>{
  await page.setViewportSize({width:1920,height:1080});
  await openLesson(page);
  const original=await page.locator('.lesson-document p').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  await page.goto('/settings');
  await page.getByRole('button',{name:/Reading Text size/}).click();
  await page.getByLabel('Text size').selectOption('extra_large');
  await page.getByLabel('Reading width').selectOption('narrow');
  await openLesson(page);
  const enlarged=await page.locator('.lesson-document p').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize));
  expect(enlarged).toBeGreaterThan(original*1.2);
  const narrow=await page.locator('.lesson-document').evaluate(el=>el.getBoundingClientRect().width);
  await page.goto('/settings');
  await page.getByRole('button',{name:/Reading Text size/}).click();
  await page.getByLabel('Reading width').selectOption('wide');
  await openLesson(page);
  const wide=await page.locator('.lesson-document').evaluate(el=>el.getBoundingClientRect().width);
  expect(wide).toBeGreaterThan(narrow+100);
});

test('each workspace has one main landmark and a keyboard skip link',async({page})=>{
  for(const path of ['/','/settings','/profile','/auth','/auth/reset','/facilitator','/institutions/manage',lesson]){
    await page.goto(path);
    await expect(page.getByRole('main')).toHaveCount(1);
    const skip=page.getByRole('link',{name:'Skip to main content',exact:true});
    await page.keyboard.press('Tab');
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(path===lesson?page.locator('#lesson-content'):page.getByRole('main')).toBeFocused();
  }
});

test('lesson notes and position indicator have accessible names and notes survive reload',async({page})=>{
  await openLesson(page);
  const note=page.getByRole('textbox',{name:'Lesson notes',exact:true});
  await note.fill('Isolated keyboard learner note');
  await expect(page.getByRole('progressbar',{name:'Position in this term'})).toHaveAttribute('aria-valuenow','5');
  await page.reload();
  await expect(page.getByRole('textbox',{name:'Lesson notes',exact:true})).toHaveValue('Isolated keyboard learner note');
});

test('offline answers and notes survive reconnect under the same response identities',async({page,context})=>{
  await openLesson(page);
  const answer=page.locator('.lesson-document textarea').first();
  await answer.fill('Online baseline answer');
  const responseKey=await page.evaluate(()=>Object.entries(JSON.parse(localStorage.getItem('applied-commerce-learning-state-v1')).promptResponses).find(([,value])=>value==='Online baseline answer')[0]);
  await context.setOffline(true);
  try{
    await answer.fill('Answer saved while offline');
    await page.getByRole('textbox',{name:'Lesson notes',exact:true}).fill('Notes saved while offline');
    expect(await page.evaluate(key=>JSON.parse(localStorage.getItem('applied-commerce-learning-state-v1')).promptResponses[key],responseKey)).toBe('Answer saved while offline');
  }finally{await context.setOffline(false);}
  await page.reload();
  await expect(page.locator('.lesson-document textarea').first()).toHaveValue('Answer saved while offline');
  await expect(page.getByRole('textbox',{name:'Lesson notes',exact:true})).toHaveValue('Notes saved while offline');
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem('applied-commerce-learning-state-v1')).promptResponses[key],responseKey)).toBe('Answer saved while offline');
});

test('compact term map traps focus, closes on Escape, and restores focus',async({page})=>{
  await page.setViewportSize({width:360,height:800});
  await openLesson(page);
  const trigger=page.getByRole('button',{name:'Open term map',exact:true});
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Term map',exact:true});
  await expect(dialog).toBeVisible();
  await expect(page.locator('.app-menu-trigger')).toBeHidden();
  const close=dialog.getByRole('button',{name:'Close term map',exact:true});
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link').last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await expect(page.locator('body')).toHaveCSS('overflow','hidden');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  // Closed off-canvas links must not be keyboard or accessibility destinations.
  await expect(page.getByRole('navigation',{name:'Term lessons'})).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
  await trigger.click();
  await page.setViewportSize({width:1280,height:900});
  await expect(page.getByRole('dialog',{name:'Term map',exact:true})).toHaveCount(0);
  await expect(page.getByRole('navigation',{name:'Term lessons'})).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
});

test('learner menu makes the background inert while open',async({page})=>{
  await page.goto('/settings');
  const trigger=page.getByRole('button',{name:'Open Applied Commerce menu'});
  await trigger.click();
  await expect(page.getByRole('dialog',{name:'Applied Commerce menu'})).toBeVisible();
  await expect(page.getByRole('main')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page.getByRole('main')).toHaveCount(1);
});

test('institution demo perspective tabs support arrows, Home and End',async({page})=>{
  await page.goto('/institutions/demo');
  const tabs=page.getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(tabs.nth(1)).toBeFocused();
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected','true');
  await expect(page.getByRole('tabpanel')).toContainText('Who needs you today?');
  await page.keyboard.press('End');
  await expect(tabs.last()).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('Evidence mix');
  await page.keyboard.press('Home');
  await expect(tabs.first()).toBeFocused();
  await expect(page.getByRole('tabpanel')).toContainText('learning tasks complete');
  await expect(tabs.nth(1)).toHaveAttribute('tabindex','-1');
});

test('lesson load failure offers retry in place without losing a saved answer',async({page})=>{
  await openLesson(page);
  const answer=page.locator('.lesson-document textarea').first();
  await answer.fill('Preserve this isolated answer through failed load');
  await page.route('**/curriculum/grade-8.part-*.b64',route=>route.fulfill({status:503,body:'Isolated unavailable curriculum'}));
  await page.reload();
  await expect(page.locator('.reader-loading [role="alert"]')).toContainText('We couldn’t open this lesson');
  await page.unroute('**/curriculum/grade-8.part-*.b64');
  await page.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(page.locator('.lesson-document textarea').first()).toHaveValue('Preserve this isolated answer through failed load');
});

test('reader print preserves lesson copy and saved notes without fixed navigation',async({page})=>{
  await openLesson(page);
  const longAnswer='A complete learner explanation that must remain visible on paper. '.repeat(20)+'END OF SAVED ANSWER';
  await page.locator('.lesson-document textarea').first().fill(longAnswer);
  await page.locator('.workbook-panel textarea').fill('Print this learner note');
  await page.emulateMedia({media:'print'});
  for(const selector of ['.reader-topbar','.reader-rail','.app-menu-trigger','.reader-footer','.workbook-actions','.lesson-complete-continue']){
    await expect(page.locator(selector)).toBeHidden();
  }
  await expect(page.locator('.lesson-heading h1')).toBeVisible();
  await expect(page.locator('.printed-lesson-notes')).toContainText('Print this learner note');
  await expect(page.locator('.lesson-document .printed-response').first()).toHaveText(longAnswer);
  await expect(page.locator('.reader-stage')).toHaveCSS('margin-left','0px');
});
