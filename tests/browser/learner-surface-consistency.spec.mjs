import fs from 'node:fs';
import {test,expect} from '@playwright/test';
const index=JSON.parse(fs.readFileSync('public/curriculum/index.json','utf8'));
const key='applied-commerce-learning-state-v1';
async function seed(page,completed={},lastOpened){
 await page.goto('/profile');
 await page.evaluate(({key,completed,lastOpened})=>localStorage.setItem(key,JSON.stringify({version:2,previousResponses:{},completed,responses:{'g8-t1-l01-001':'Preserved learner note'},promptResponses:{},profile:{displayName:'Surface consistency learner',grade:9},activeGrade:9,lastOpened})),{key,completed,lastOpened});
}
test('home, library, grade map and progress agree without counting assessment or historical completions',async({page})=>{
 const ids=index.grades.find(g=>g.grade===9).lessonIds;
 const completed=Object.fromEntries([...ids,'g9-t1-assessment-1','g9-t1-l99-999','g8-t1-l01-001','g8-t1-l99-999'].map(id=>[id,'2026-10-17T18:00:00Z']));
 await seed(page,completed);await page.goto('/');
 await expect(page.locator('.home-today-status')).toContainText('75 of 75 lessons complete');await expect(page.locator('.home-today-status strong')).toHaveText('100% complete');
 await page.goto('/learn');await expect(page.locator('.grade-card.grade-9')).toContainText('100%');await expect(page.locator('.grade-card.grade-8')).toContainText('1%');
 await page.goto('/learn/9');await expect(page.locator('.grade-progress')).toContainText('75 of 75 lessons complete');
 await page.goto('/progress');await expect(page.locator('.progress-grade-list a[href="/learn/9"]')).toContainText('75 of 75 completed');
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);expect(saved.completed['g9-t1-assessment-1']).toBeTruthy();expect(saved.completed['g9-t1-l99-999']).toBeTruthy();
});
for(const [name,path,ready] of [['home','/','.home-today-status'],['library','/learn','.grade-grid'],['grade map','/learn/9','.grade-hero']]){
 test(name+' recovers a failed curriculum load without false progress or lost work',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await seed(page);
  const fail=route=>route.fulfill({status:503,body:'Injected isolated curriculum failure'});
  await page.route('**/curriculum/**',fail);await page.goto(path);
  await expect(page.locator('p[role="alert"]')).toContainText('Your saved work is preserved');
  await expect(page.getByRole('button',{name:'Try again',exact:true})).toBeVisible();
  if(name==='home')await expect(page.locator(ready)).not.toContainText('0 of 0');
  expect(errors).toEqual([]);await page.unroute('**/curriculum/**',fail);await page.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(page.locator(ready)).toBeVisible();await expect(page.locator('p[role="alert"]')).toHaveCount(0);
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);expect(saved.responses['g8-t1-l01-001']).toBe('Preserved learner note');
 });
}
test('home does not label a newly selected lesson with the previous lesson title',async({page,context})=>{
 await seed(page,{}, {grade:8,term:1,unitId:'g8-t1-l01-001',at:'2026-10-17T18:00:00Z'});
 let releaseInitial;const initialGate=new Promise(resolve=>{releaseInitial=resolve;});let initialRequests=0;
 await page.route('**/curriculum/grade-8.part-*.b64',async route=>{initialRequests++;await initialGate;await route.continue();});
 await page.goto('/');const heading=page.locator('.home-continue-card h2');
 try{await expect.poll(()=>initialRequests).toBeGreaterThan(0);await expect(heading).toHaveText('Grade 8');await expect(page.locator('.home-primary-action')).toHaveAttribute('href','/learn/8/term/1/g8-t1-l01-001');}
 finally{releaseInitial();await page.unrouteAll({behavior:'wait'});}
 await expect(heading).not.toHaveText('Grade 8');const old=await heading.textContent();
 let release;const gate=new Promise(resolve=>{release=resolve;});let intercepted=0;
 await page.route('**/curriculum/grade-9.part-*.b64',async route=>{intercepted++;await gate;await route.continue();});
 const other=await context.newPage();await other.goto('/profile');
 await other.evaluate(key=>{const state=JSON.parse(localStorage.getItem(key));state.lastOpened={grade:9,term:1,unitId:'g9-t1-l01-001',at:'2026-10-17T18:05:00Z'};localStorage.setItem(key,JSON.stringify(state));},key);
 try{await expect.poll(()=>intercepted).toBeGreaterThan(0);await expect(heading).not.toHaveText(old);}
 finally{release();await page.unrouteAll({behavior:'wait'});await other.close();}
 await expect(heading).not.toHaveText('Grade 9');await expect(page.locator('.home-primary-action')).toHaveAttribute('href','/learn/9/term/1/g9-t1-l01-001');
});

test('facilitator report CSS fixture prints readable copy without mobile navigation in dark and system modes',async({page})=>{
 await page.emulateMedia({colorScheme:'dark'});await page.goto('/settings');await page.getByRole('button',{name:/Appearance/}).click();
 await page.evaluate(()=>{const root=document.createElement('main');root.className='app-shell facilitator-shell';root.id='print-contract-fixture';root.innerHTML='<div class="fac-console"><aside class="fac-sidebar">Workspace navigation</aside><main class="fac-main"><div class="fac-section-stack"><div class="fac-report-actions">Print actions</div><article class="fac-report-sheet"><header><div><p class="eyebrow">Learner report</p><h1>Print contract learner</h1><p>Saved evidence summary</p></div></header></article></div></main></div><button class="fac-menu-trigger">Open facilitator menu</button><div class="fac-menu-sheet">Mobile navigation</div></main>';document.body.appendChild(root);});
 for(const theme of ['dark','system']){
  await page.emulateMedia({media:'screen',colorScheme:'dark'});await page.getByLabel('Theme').selectOption(theme);await expect(page.locator('html')).toHaveAttribute('data-ac-appearance',theme);
  await page.emulateMedia({media:'print',colorScheme:'dark'});
  const fixture=page.locator('#print-contract-fixture');await expect(fixture.locator('.fac-menu-trigger')).toBeHidden();await expect(fixture.locator('.fac-report-actions')).toBeHidden();
  const ratio=await fixture.locator('.fac-report-sheet h1').evaluate(el=>{
   const luminance=color=>{const [r,g,b]=(color.match(/[\d.]+/g)??[]).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b;};
   const a=luminance(getComputedStyle(el).color),b=luminance(getComputedStyle(el.closest('.fac-report-sheet')).backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });expect(ratio,'printed heading contrast in '+theme).toBeGreaterThanOrEqual(4.5);
 }
});
