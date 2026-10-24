import fs from 'node:fs';
import {test,expect} from '@playwright/test';

test('local synthetic print cascade avoids duplicate teacher margins and retains report margins',async({page})=>{
 const styles=['app/foundation.css','app/evidence.css','app/classroom.css','app/contextual-teacher.css'].map(file=>fs.readFileSync(file,'utf8')).join('\n');
 await page.setContent('<style>'+styles+'</style><div class="app-shell facilitator-shell"><main><div class="standalone-teaching-plan"><div class="contextual-print-guide">Synthetic teaching text</div></div></main></div>');
 await page.emulateMedia({media:'print'});
 const padding=()=>page.locator('.facilitator-shell').evaluate(node=>['Top','Right','Bottom','Left'].map(edge=>parseFloat(getComputedStyle(node)['padding'+edge])));
 expect(await padding()).toEqual([0,0,0,0]);
 await expect(page.locator('.contextual-print-guide')).toBeVisible();
 // Existing institutional reports retain their independent 12 mm padding.
 await page.locator('main').evaluate(node=>{node.innerHTML='<article class="fac-report-sheet">Synthetic institution report</article>';});
 for(const value of await padding())expect(value).toBeCloseTo(12*96/25.4,1);
});
