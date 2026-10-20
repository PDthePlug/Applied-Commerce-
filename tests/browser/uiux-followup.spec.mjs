import {test,expect} from '@playwright/test';

const lesson='/learn/8/term/1/g8-t1-l01-001';

test('alternative activity disclosure has a usable touch target and preserves content',async({page},testInfo)=>{
  await page.goto(lesson);
  const summary=page.locator('.home-alternative-path > summary').first();
  await expect(summary).toBeVisible();
  const before=await summary.locator('..').textContent();
  const box=await summary.boundingBox();
  await testInfo.attach('alternative target',{body:Buffer.from(JSON.stringify({viewport:page.viewportSize(),box})),contentType:'application/json'});
  expect(box.height).toBeGreaterThanOrEqual(44);
  await summary.click();
  await expect(summary.locator('..')).toHaveAttribute('open','');
  expect(await summary.locator('..').textContent()).toBe(before);
  await summary.focus();await page.keyboard.press('Enter');
  await expect(summary.locator('..')).not.toHaveAttribute('open','');
});

test('reader position and account wrappers use supported accessible names',async({page})=>{
  await page.goto(lesson);
  await expect(page.locator('.lesson-heading h1')).toBeVisible();
  await expect.soft(page.locator('.reader-progress')).toHaveRole('group');
  await expect.soft(page.getByRole('group',{name:'Lesson 1 of 20',exact:true})).toBeVisible();
  await page.goto('/auth');
  await expect.soft(page.locator('.auth-entry')).not.toHaveAttribute('aria-label');
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
});

test('assessment radio choices use their full label as a touch target',async({page})=>{
  await page.goto('/learn/9/term/1/g9-t1-assessment-1');
  const radio=page.locator('.assessment-choice-list input[type=radio]').first();
  const label=radio.locator('..');
  await expect(label).toBeVisible();
  const box=await label.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  const native=await radio.boundingBox();
  // Activate outside the small native circle to verify the label's larger hit area.
  await page.mouse.click(box.x+box.width-6,native.y+native.height/2);
  await expect(radio).toBeChecked();
});
