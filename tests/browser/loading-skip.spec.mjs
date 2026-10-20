import {test,expect} from '@playwright/test';

test('reader skip target keeps focus while its lesson bundle is loading',async({page})=>{
  let release;
  const pending=new Promise(resolve=>{release=resolve;});
  await page.route('**/curriculum/grade-8.part-*.b64',async route=>{await pending;await route.continue();});
  await page.goto('/learn/8/term/1/g8-t1-l01-001');
  await expect(page.getByRole('status')).toContainText('Opening lesson');
  try{
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link',{name:'Skip to main content',exact:true})).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#lesson-content')).toBeFocused({timeout:3000});
  }finally{release();await page.unrouteAll({behavior:'wait'});}
  await expect(page.locator('.lesson-heading h1')).toBeVisible();
  await expect(page.locator('#lesson-content')).toBeFocused();
});
