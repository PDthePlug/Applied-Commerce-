// Genuine hosted period navigation; guide strings remain in memory.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {loadRoleFixtures} from './lib/validation-target.mjs';
import {stagingLessonScope} from './lib/staging-lesson-scope.mjs';
process.umask(0o077);
const {config,fixtures}=loadRoleFixtures(process.env.AC_ROLE_FIXTURES);
assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const baseURL=process.env.AC_ROLE_BASE_URL;
assert.ok(new URL(baseURL).hostname.startsWith('applied-commerce-sa-staging'));
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE)).content[0].text);
const manifest=JSON.parse(fs.readFileSync('content/instructional/teaching-manifest.v2.json'));
assert.ok(process.env.AC_STAGING_LESSONS,'Select multi-period lessons explicitly');
const selection=stagingLessonScope(manifest.plans,process.env.AC_STAGING_LESSONS);
const results={authentication:'genuine browser password login',projectRef:config.projectRef,scope:selection.scope,releasedPlans:selection.releasedPlans,plans:[],pageErrors:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(results,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const context=await browser.newContext({baseURL}),page=await context.newPage();
 page.on('pageerror',error=>results.pageErrors.push(error.name));
 await page.goto(access.shareableUrl);
 const health=await(await page.request.get('/api/health')).json();
 assert.equal(health.projectRef,config.projectRef);assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);results.commit=health.commit;
 await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(fixtures.users.facilitator.email);await page.getByLabel('Password',{exact:true}).fill(fixtures.users.facilitator.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});
 for(const binding of selection.plans){
  const response=await page.request.get('/api/classroom?catalog=omit&lesson='+binding.lessonId);assert.equal(response.status(),200);
  const {plan}=await response.json();assert.ok(plan.periods.length>1);assert.equal(plan.periods.length,binding.periods);
  await page.goto(`/learn/${binding.grade}/term/${binding.term}/${binding.lessonId}`);await page.getByRole('button',{name:'Teacher View',exact:true}).click();
  const prep=page.locator('[data-instructional-location="preparation"]');await prep.waitFor();assert.ok((await prep.locator(':scope > summary').innerText()).includes(`${plan.periods.length} × 45 minutes`));
  await prep.locator(':scope > summary').click();for(const period of plan.periods)assert.equal(await prep.locator(`[data-instructional-field="${period.title}"]`).innerText(),plan.fields[period.title]);await prep.locator(':scope > summary').click();
  const periods=[];
  for(const [index,period]of plan.periods.entries()){
   const ids=await page.locator(`#classroom-stage optgroup[label="Period ${index+1}"] option`).evaluateAll(nodes=>nodes.map(node=>node.value));assert.deepEqual(ids,period.moments);
   assert.equal(period.moments.reduce((minutes,id)=>minutes+plan.moments.find(moment=>moment.id===id).minutes,0),45);
   for(const id of [period.moments[0],period.moments.at(-1)]){
    await page.locator('#classroom-stage').selectOption(id);await page.getByRole('button',{name:'Go to stage',exact:true}).click();assert.equal(await page.evaluate(()=>document.activeElement?.id),'teacher-moment-'+id);
    const moment=plan.moments.find(row=>row.id===id),target=page.locator(`[data-instructional-location="${id}"]`);assert.equal(await target.getAttribute('open'),'');assert.ok((await target.locator(':scope > summary').innerText()).includes(`Period ${index+1}`));
    const cue=moment.core.find(group=>group.heading==='Facilitation cue');if(cue)assert.equal(await target.locator('[data-facilitation-cue]').innerText(),plan.fields[cue.fields[0]]);
    if(process.env.AC_PERIOD_CAPTURE_DIR){
     fs.mkdirSync(process.env.AC_PERIOD_CAPTURE_DIR,{recursive:true,mode:0o700});
     for(const width of [320,1280]){
      await page.setViewportSize({width,height:900});
      // A desktop-to-mobile resize animates the existing term rail away. Do
      // not mistake an in-flight transition for the settled reading layout.
      if(width===320){const dialog=page.getByRole('dialog',{name:'Term map',exact:true});if(await dialog.count())await dialog.getByRole('button',{name:'Close term map',exact:true}).click();await page.waitForFunction(()=>{const rail=document.querySelector('.reader-rail');return rail?.getAttribute('aria-hidden')==='true'&&rail.getBoundingClientRect().right<=1;});}
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await target.scrollIntoViewIfNeeded();await page.screenshot({path:process.env.AC_PERIOD_CAPTURE_DIR+`/period-${index+1}-${id}-${width}.png`,animations:'disabled'});
     }
    }
   }
   periods.push({period:index+1,minutes:45,stages:period.moments.length,firstAndLastTargetsFocused:true,cuesMatchAuthorisedPlan:true});
  }
  results.plans.push({lessonId:binding.lessonId,periodCount:plan.periods.length,scheduledMinutes:45*plan.periods.length,preparationAndNavigator:true,sameLearnerLesson:true,...(process.env.AC_PERIOD_CAPTURE_DIR?{capturedWidths:[320,1280],noHorizontalOverflow:true}:{}),periods});save();
 }
 assert.equal(results.pageErrors.length,0);console.log(JSON.stringify({plans:results.plans.length,periods:results.plans.map(plan=>plan.periodCount),pageErrors:results.pageErrors}));
}catch(error){results.failure=error.message;save();throw error;}finally{await browser.close();}
