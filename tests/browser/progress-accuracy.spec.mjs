import {test,expect} from '@playwright/test';
test('completing assessment content preserves that record without inflating the lesson progress map',async({page})=>{
 await page.goto('/learn/9/term/1/g9-t1-assessment-1');await page.getByRole('button',{name:'Complete and continue',exact:true}).click();await page.goto('/progress');await expect(page.locator('.progress-overview')).toContainText('0 of 395 lessons complete');
 await page.goto('/learn/8/term/1/g8-t1-l01-001');await page.getByRole('button',{name:'Complete and continue',exact:true}).click();await page.goto('/progress');await expect(page.locator('.progress-overview')).toContainText('1 of 395 lessons complete');await expect(page.locator('.progress-grade-list a[href="/learn/9"]')).toContainText('0 of 75 completed');
 expect(await page.evaluate(()=>Object.keys(localStorage).filter(key=>key.startsWith('applied-commerce-learning-state')).some(key=>Boolean(JSON.parse(localStorage.getItem(key)).completed?.['g9-t1-assessment-1'])))).toBe(true);
});
