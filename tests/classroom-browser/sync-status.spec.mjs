import {test,expect} from '@playwright/test';import AxeBuilder from '@axe-core/playwright';
test('sync error and retry action remain readable in dark appearance',async({page})=>{
 await page.route('**/*',route=>{const url=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(url.hostname)?route.continue():route.abort('blockedbyclient');});
 await page.route('**/api/preferences',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({preferences:{appearance:'dark'}})}));
 await page.emulateMedia({colorScheme:'dark'});await page.goto('/facilitator/classroom');
 await expect(page.getByRole('article',{name:'Draft teacher guide'})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('data-ac-appearance','dark');
 const warning=page.getByRole('complementary',{name:'Account sync'});await expect(warning).toBeVisible();
 const axe=await new AxeBuilder({page}).include('.learning-sync-status').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations).toEqual([]);
 const retry=warning.getByRole('button',{name:'Retry sync'});expect((await retry.boundingBox()).height).toBeGreaterThanOrEqual(44);await retry.focus();await expect(retry).toBeFocused();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
});
