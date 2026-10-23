import {test,expect}from '@playwright/test';import {runtimeUnits}from '../../scripts/semantic-census.mjs';
const units=await runtimeUnits();
for(const [grade,number]of[[8,1],[8,8],[8,10],[12,5]])test(`Grade ${grade} lesson ${number} keeps checkpoint layout and original answers`,async({page},info)=>{
 const unit=units.find(u=>u.grade===grade&&u.startLesson===number&&u.type==='lesson'),href=`/learn/${grade}/term/${unit.term}/${unit.id}`;await page.goto(href);
 const checkpoint=page.locator('.learning-section.learning-mode-prove').filter({has:page.locator('.checkpoint-question')}).first();await checkpoint.waitFor();
 const labels=await checkpoint.locator('.structured-part-label').allTextContents();expect(labels).toEqual(labels.map((_,i)=>`${i+1}.`));
 const questions=checkpoint.locator('.checkpoint-question');const answer=checkpoint.getByRole('textbox').first();const originalCount=await checkpoint.getByRole('textbox').count();
 for(const scale of [1,1.28,2]){
  await page.evaluate(scale=>document.documentElement.style.setProperty('--ac-text-scale',String(scale)),scale);
  const q=questions.first();await q.scrollIntoViewIfNeeded();const boxes=await q.evaluate(node=>{const n=node.querySelector('.structured-part-label'),p=node.querySelector('.question-prompt'),s=getComputedStyle(node);const a=n.getBoundingClientRect(),b=p.getBoundingClientRect();return {display:s.display,nx:a.x,nright:a.right,px:b.x,ny:a.y,py:b.y,text:parseFloat(getComputedStyle(p).fontSize),number:parseFloat(getComputedStyle(n).fontSize)};});
  expect(boxes.display).toBe('grid');expect(boxes.px).toBeGreaterThan(boxes.nright);expect(Math.abs(boxes.ny-boxes.py)).toBeLessThan(12*scale);expect(boxes.text).toBeGreaterThanOrEqual(16);expect(boxes.number).toBeGreaterThanOrEqual(14);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);await expect(checkpoint.getByRole('textbox')).toHaveCount(originalCount);
  await page.screenshot({path:`test-results/rollout/checkpoint-${grade}-${number}-${info.project.name}-scale-${scale}.png`});
 }
 await answer.fill('Synthetic checkpoint explanation');await expect(answer.locator('..').getByText('Captured',{exact:true})).toBeVisible();await page.reload();await expect(answer).toHaveValue('Synthetic checkpoint explanation');await answer.fill('');await page.reload();await expect(answer).toHaveValue('');await expect(page.getByText('Type your response',{exact:true})).toHaveCount(0);
});

test('split and previous combined answers remain independently recoverable',async({page})=>{
 const unit=units.find(u=>u.id==='g8-t1-l08-008'),key=slot=>`${unit.id}::prompt-${unit.blocks[40].id}::${slot}`;
 await page.addInitScript(({answers})=>{if(!localStorage.getItem('applied-commerce-learning-state-v1'))localStorage.setItem('applied-commerce-learning-state-v1',JSON.stringify({version:2,completed:{},responses:{},promptResponses:answers}));},{answers:{[key('response')]:'Earlier combined answer',[key('response-0')]:'Data',[key('response-1')]:'Homework and entertainment have different purposes'}});
 await page.goto('/learn/8/term/1/'+unit.id);const checkpoint=page.locator('.learning-section.learning-mode-prove').first();await expect(checkpoint.getByRole('textbox',{name:'Choose one item from your list.',exact:true})).toHaveValue('Data');await checkpoint.getByText('Previous combined response',{exact:true}).click();await expect(checkpoint.getByText('Earlier combined answer',{exact:true})).toBeVisible();await checkpoint.getByRole('textbox').first().fill('');await page.reload();await checkpoint.getByText('Previous combined response',{exact:true}).click();await expect(checkpoint.getByText('Earlier combined answer',{exact:true})).toBeVisible();
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('applied-commerce-learning-state-v1')).promptResponses);expect(saved[key('response-0')]).toBe('');expect(saved[key('response')]).toBe('Earlier combined answer');expect(saved[key('response-1')]).toBe('Homework and entertainment have different purposes');
});
