// Genuine, sequential staging measurements. Never emit authenticated bodies,
// cookies or guide text. First sample does not establish a cold server process.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {loadRoleFixtures} from './lib/validation-target.mjs';
process.umask(0o077);
const {config,fixtures}=loadRoleFixtures(process.env.AC_ROLE_FIXTURES);
assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const baseURL=process.env.AC_ROLE_BASE_URL;
assert.ok(new URL(baseURL).hostname.startsWith('applied-commerce-sa-staging'));
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE)).content[0].text);
const manifest=JSON.parse(fs.readFileSync('content/instructional/teaching-manifest.v2.json'));
const ids=process.env.AC_DELIVERY_LESSONS?.split(',').filter(Boolean);
assert.ok(ids?.length&&ids.every(id=>manifest.plans.some(p=>p.lessonId===id)));
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const result={at:new Date().toISOString(),projectRef:config.projectRef,baseURL,authentication:'genuine browser password login',measurement:'sequential end-to-end through coding proxy; decoded response bytes',coldProcess:'NOT DEMONSTRATED',serverMemory:'NOT MEASURED',samples:[]};
try{
 const context=await browser.newContext({baseURL}),page=await context.newPage();
 await page.goto(access.shareableUrl);
 const healthResponse=await page.request.get('/api/health');assert.equal(healthResponse.status(),200);
 const health=await healthResponse.json();assert.equal(health.projectRef,config.projectRef);assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);result.commit=health.commit;
 await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(fixtures.users.facilitator.email);await page.getByLabel('Password',{exact:true}).fill(fixtures.users.facilitator.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});
 for(const lessonId of ids)for(let request=1;request<=5;request++){
  const started=performance.now(),response=await page.request.get('/api/classroom?catalog=omit&lesson='+encodeURIComponent(lessonId)),body=await response.body();assert.equal(response.status(),200);
  const data=JSON.parse(body.toString());assert.equal(data.plan.lessonId,lessonId);const binding=manifest.plans.find(p=>p.lessonId===lessonId);assert.equal(Object.keys(data.plan.fields).length,binding.fieldCount);
  const cache=response.headers()['cache-control'];assert.match(cache,/private/);assert.match(cache,/no-store/);
  result.samples.push({lessonId,request,ms:Math.round(performance.now()-started),decodedBytes:body.length,cache});
 }
 const median=values=>{const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;};
 result.lessons=ids.map(lessonId=>{const rows=result.samples.filter(r=>r.lessonId===lessonId);return {lessonId,decodedBytes:rows[0].decodedBytes,firstSampleMs:rows[0].ms,repeatedMedianMs:median(rows.slice(1).map(r=>r.ms)),rangeMs:[Math.min(...rows.map(r=>r.ms)),Math.max(...rows.map(r=>r.ms))]};});
 fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({lessons:ids.length,requests:result.samples.length,coldProcess:result.coldProcess,serverMemory:result.serverMemory}));
}finally{await browser.close();}
