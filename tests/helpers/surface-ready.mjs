import {expect} from '@playwright/test';

// Network idle can precede deferred React effects and decoded curriculum loads.
// Capture the completed surface rather than accepting a loading-shell screenshot.
export async function surfaceReady(page,path){
  if(path==='/')await expect(page.locator('.home-today-status strong')).toHaveText(/^\d+% complete$/);
  else if(path==='/learn')await expect(page.locator('.grade-grid .grade-card')).toHaveCount(5);
  else if(/^\/learn\/\d+$/.test(path))await expect(page.locator('.grade-hero h1')).toBeVisible();
  else if(path.includes('/term/'))await expect(page.locator('.lesson-heading h1')).toBeVisible();
  else if(path==='/progress')await expect(page.locator('.progress-grade-list a')).toHaveCount(5);
  else if(path==='/portfolio'){
    await expect(page.locator('.portfolio-synthesis')).toBeVisible();
    await expect(page.locator('.portfolio-page [role="status"]')).toHaveCount(0);
  }
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('html')).toHaveAttribute('data-ac-appearance',/^(system|light|warm|dark)$/);
  await page.evaluate(async()=>{
    await document.fonts.ready;
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  });
}
