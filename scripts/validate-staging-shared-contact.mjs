// Verify a sequential shared contact through genuine educator login and the
// existing lesson footer/navigator. This is not a classroom timing trial.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {loadRoleFixtures} from './lib/validation-target.mjs';
import {provisionalContactPeriods} from './lib/programme-contact-periods.mjs';
import {runtimeUnits} from './semantic-census.mjs';
process.umask(0o077);
const {config,fixtures}=loadRoleFixtures(process.env.AC_ROLE_FIXTURES);
assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const baseURL=process.env.AC_ROLE_BASE_URL;
assert.ok(new URL(baseURL).hostname.startsWith('applied-commerce-sa-staging'));
const firstId='g10-t3-l57-057',secondId='g10-t3-l58-058';
const titles=new Map((await runtimeUnits()).filter(unit=>[firstId,secondId].includes(unit.id)).map(unit=>[unit.id,unit.title]));
assert.equal(titles.size,2);
const coverage=JSON.parse(fs.readFileSync('docs/programme-rollout/coverage.json'));
const rows=[firstId,secondId].map(id=>coverage.lessons.find(row=>row.lessonId===id));
assert.ok(rows.every(row=>row?.grade===10&&row.term===3));
assert.ok(rows[0].sharedContactGroup&&rows[0].sharedContactGroup===rows[1].sharedContactGroup);
assert.equal(provisionalContactPeriods(rows),1);
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE)).content[0].text);
const results={at:new Date().toISOString(),projectRef:config.projectRef,authentication:'genuine staging educator password login',lessons:[firstId,secondId],sharedContactGroup:rows[0].sharedContactGroup,authoredLessons:2,recommendedProvisionalContacts:1,educatorTimingTrial:'NOT DEMONSTRATED',pageErrors:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(results,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const path=id=>'/learn/10/term/3/'+id;
try{
 const context=await browser.newContext({baseURL,viewport:{width:1280,height:900}}),page=await context.newPage();page.on('pageerror',e=>results.pageErrors.push(e.name));
 await page.goto(access.shareableUrl);const healthResponse=await page.request.get('/api/health');assert.equal(new URL(healthResponse.url()).origin,baseURL);assert.match(healthResponse.headers()['content-type']??'',/application\/json/);const health=await healthResponse.json();assert.equal(health.projectRef,config.projectRef);assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);results.commit=health.commit;
 await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(fixtures.users.facilitator.email);await page.getByLabel('Password',{exact:true}).fill(fixtures.users.facilitator.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});
 const plans=[];
 for(const id of[firstId,secondId]){const r=await page.request.get('/api/classroom?catalog=omit&lesson='+id);assert.equal(r.status(),200);const {plan}=await r.json();assert.equal(plan.lessonId,id);assert.equal(plan.periods.length,1);assert.equal(plan.periods[0].minutes,45);assert.match(plan.fields[plan.periods[0].title],/Shared/i);plans.push(plan);}
 const timed=plan=>plan.moments.filter(moment=>moment.schedule==='classroom');
 const first=timed(plans[0]),second=timed(plans[1]),transition=first.at(-1),earlier=second[0];
 const elapsed=first.slice(0,-1).reduce((n,m)=>n+m.minutes,0),remaining=second.slice(1).reduce((n,m)=>n+m.minutes,0);
 assert.equal(elapsed,earlier.minutes);assert.equal(remaining,transition.minutes);assert.equal(elapsed+remaining,45);assert.ok(elapsed>0&&remaining>0);assert.match(plans[1].fields[earlier.title],/earlier|elapsed/i);
 Object.assign(results,{rawGuidePeriodAllocations:2,earlierLetterMinutes:elapsed,remainingClosingMinutes:remaining,scheduleConservesOneContact:true});
 async function ensureTeacher(plan){await page.getByRole('heading',{level:1,name:titles.get(plan.lessonId),exact:true}).waitFor({timeout:60000});await page.getByRole('button',{name:/^(Teacher View|Learner View)$/}).first().waitFor({timeout:60000});const button=page.getByRole('button',{name:'Teacher View',exact:true});if(await button.count())await button.click();const prep=page.locator('[data-instructional-location="preparation"]');await prep.waitFor();if(await prep.getAttribute('open')===null)await prep.locator(':scope > summary').click();assert.equal(await prep.locator(`[data-instructional-field="${plan.periods[0].title}"]`).innerText(),plan.fields[plan.periods[0].title]);await prep.locator(':scope > summary').click();assert.equal(await page.getByRole('navigation',{name:'Classroom teaching stages',exact:true}).count(),1);assert.equal(await page.locator('.contextual-guidance nav').count(),0);}
 async function stage(plan,moment){await page.locator('#classroom-stage').selectOption(moment.id);await page.getByRole('button',{name:'Go to stage',exact:true}).click();assert.equal(await page.evaluate(()=>document.activeElement?.id),'teacher-moment-'+moment.id);const target=page.locator(`[data-instructional-location="${moment.id}"]`);assert.equal(await target.getAttribute('open'),'');const cue=moment.core.find(group=>group.heading==='Facilitation cue');assert.equal(await target.locator('[data-facilitation-cue]').innerText(),plan.fields[cue.fields[0]]);return target;}
 await page.goto(path(firstId));await ensureTeacher(plans[0]);await stage(plans[0],transition);assert.equal(await page.locator('.lesson-document').getByRole('textbox').count(),3);
 const next=page.locator('.reader-footer a.next');assert.equal(new URL(await next.getAttribute('href'),baseURL).pathname,path(secondId));await next.click();await page.waitForURL('**'+path(secondId));await ensureTeacher(plans[1]);results.existingNextLessonNavigation=true;assert.equal(await page.locator('.lesson-document').getByRole('textbox').count(),4);
 const captures=[];
 for(const width of[320,1280]){
  await page.setViewportSize({width,height:900});if(width===320)await page.waitForFunction(()=>{const rail=document.querySelector('.reader-rail');return rail?.getAttribute('aria-hidden')==='true'&&rail.getBoundingClientRect().right<=1;});
  for(const moment of[earlier,second[1],second[2]]){const target=await stage(plans[1],moment);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);if(process.env.AC_SHARED_CONTACT_CAPTURE_DIR){fs.mkdirSync(process.env.AC_SHARED_CONTACT_CAPTURE_DIR,{recursive:true,mode:0o700});await target.scrollIntoViewIfNeeded();await page.screenshot({path:process.env.AC_SHARED_CONTACT_CAPTURE_DIR+'/'+moment.id+'-'+width+'.png',animations:'disabled'});}captures.push({width,target:moment.id,focused:true,open:true,noHorizontalOverflow:true});}
 }
 results.closingContextAndCurrentStages=captures;
 const previous=page.locator('.reader-footer a').first();assert.equal(new URL(await previous.getAttribute('href'),baseURL).pathname,path(firstId));await previous.click();await page.waitForURL('**'+path(firstId));await ensureTeacher(plans[0]);await stage(plans[0],first[1]);results.existingPreviousLessonReturn=true;
 assert.equal(results.pageErrors.length,0);save();await context.close();console.log(JSON.stringify({lessons:2,recommendedProvisionalContacts:1,rawAllocations:2,earlierMinutes:elapsed,closingMinutes:remaining,existingNextAndPreviousNavigation:true,focusedStageCaptures:captures.length,educatorTimingTrial:'NOT DEMONSTRATED',commit:results.commit}));
}catch(error){results.failure=error.message;save();throw error;}finally{await browser.close();}
