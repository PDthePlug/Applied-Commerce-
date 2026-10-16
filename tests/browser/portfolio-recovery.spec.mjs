import {test,expect} from '@playwright/test';
test('portfolio curriculum failure preserves saved answers and gives recovery instead of a false empty state',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/learn/8/term/1/g8-t1-l01-001');const answer=page.locator('.lesson-document textarea').first();await answer.fill('Saved portfolio recovery evidence');
 await expect.poll(()=>page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('applied-commerce-learning-state')).some(key=>localStorage.getItem(key)?.includes('Saved portfolio recovery evidence')))).toBe(true);
 await page.route('**/curriculum/grade-*.part-*.b64',route=>route.fulfill({status:503,body:'Injected content failure'}));
 await page.goto('/portfolio');await expect(page.locator('.portfolio-page').getByRole('alert')).toContainText('Your saved work is preserved');await expect(page.getByRole('heading',{name:'Your portfolio is ready.',exact:true})).toHaveCount(0);
 expect(errors).toEqual([]);
 expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('applied-commerce-learning-state')).some(key=>localStorage.getItem(key)?.includes('Saved portfolio recovery evidence')))).toBe(true);
 await page.unroute('**/curriculum/grade-*.part-*.b64');await page.reload();await expect(page.locator('.portfolio-page').getByRole('alert')).toHaveCount(0);await expect(page.locator('.portfolio-page').getByRole('status')).toHaveCount(0);await page.goto('/learn/8/term/1/g8-t1-l01-001');await expect(page.locator('.lesson-document textarea').first()).toHaveValue('Saved portfolio recovery evidence');
});
