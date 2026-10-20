import {test,expect} from '@playwright/test';

test('authored list blanks wrap at 320px and keep saved choices',async({page})=>{
  await page.setViewportSize({width:320,height:760});
  await page.goto('/learn/8/term/4/g8-t4-l72-071');
  await expect(page.locator('.lesson-heading h1')).toBeVisible();
  const source=page.locator('.lesson-document').getByText(/^If yes, what surprised me most\?/).first();
  const original=(await source.textContent()).replace(/_{3,}/g,'').trim();
  const yes=page.getByRole('radiogroup',{name:'Have I done the interview?',exact:true}).first().getByRole('radio',{name:'Yes',exact:true});
  await yes.click();
  for(const scale of ['standard','extra_large']){
    await page.evaluate(scale=>document.documentElement.dataset.acTextSize=scale,scale);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
    expect((await source.textContent()).replace(/_{3,}/g,'').trim()).toBe(original);
  }
  await page.reload();
  await expect(page.getByRole('radiogroup',{name:'Have I done the interview?',exact:true}).first().getByRole('radio',{name:'Yes',exact:true})).toHaveAttribute('aria-checked','true');
});

test('authored list response fields save under stable identities and reach portfolio',async({page})=>{
  await page.goto('/learn/8/term/4/g8-t4-l72-071');
  const answer=page.getByRole('textbox',{name:/If yes, what surprised me most\?/});
  await answer.fill('The interview changed my assumptions about price.');
  const stable='g8-t4-l72-071::prompt-b60ef2e998c7dbfa1753a22f-1::blank-0';
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem('applied-commerce-learning-state-v1')).promptResponses[key],stable)).toBe('The interview changed my assumptions about price.');
  await page.reload();
  await expect(page.getByRole('textbox',{name:/If yes, what surprised me most\?/})).toHaveValue('The interview changed my assumptions about price.');
  await page.goto('/portfolio');
  const evidence=page.locator('.portfolio-artifact-responses').filter({hasText:'The interview changed my assumptions about price.'}).first();
  await evidence.locator('summary').click();
  await expect(evidence.locator('.portfolio-evidence')).toContainText('The interview changed my assumptions about price.');
});
