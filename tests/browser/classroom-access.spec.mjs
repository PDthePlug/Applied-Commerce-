import {test,expect} from '@playwright/test';
test('classroom guidance stays private in the real local-mode app',async({page,request})=>{
 const response=await request.get('/api/classroom?lesson=g8-t1-l08-008');expect(response.status()).toBe(401);expect(response.headers()['cache-control']).toContain('no-store');expect(await response.json()).not.toHaveProperty('guide');
 await page.goto('/facilitator/classroom?lesson=g8-t1-l08-008');await expect(page.getByRole('heading',{name:'Sign in to open teacher guidance.'})).toBeVisible();await expect(page.getByRole('article',{name:'Draft teacher guide'})).toHaveCount(0);
 expect((await request.get('/content/instructional/benchmark-guides.v1.plain.json')).status()).toBe(404);
});
test('classroom return context preserves the source lesson without granting access',async({page})=>{
 await page.goto('/learn/8/term/1/g8-t1-l08-008?classroom=1');await expect(page.locator('.lesson-heading h1')).toBeVisible();
 const response=page.locator('.lesson-document textarea').first();await response.fill('A fictional purchase can meet different needs in different circumstances.');
 const stable=await page.evaluate(()=>Object.entries(JSON.parse(localStorage.getItem('applied-commerce-learning-state-v1')).promptResponses).find(([,value])=>value==='A fictional purchase can meet different needs in different circumstances.')[0]);
 await page.getByRole('textbox',{name:'Lesson notes',exact:true}).fill('Classroom context must preserve this local note.');
 await page.getByRole('link',{name:'Back to teacher guidance'}).click();await expect(page.getByRole('heading',{name:'Sign in to open teacher guidance.'})).toBeVisible();
 await page.goBack();await expect(page.locator('.lesson-document textarea').first()).toHaveValue('A fictional purchase can meet different needs in different circumstances.');await expect(page.getByRole('textbox',{name:'Lesson notes',exact:true})).toHaveValue('Classroom context must preserve this local note.');
 expect(await page.evaluate(key=>JSON.parse(localStorage.getItem('applied-commerce-learning-state-v1')).promptResponses[key],stable)).toBe('A fictional purchase can meet different needs in different circumstances.');
});
