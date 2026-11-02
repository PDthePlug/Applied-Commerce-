// Genuine, sequential staging measurements. Never emit authenticated bodies,
// cookies or guide text. First sample does not establish a cold server process.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {loadRoleFixtures} from './lib/validation-target.mjs';
import {boundedDeliveryMap,validateDeliverySample} from './lib/classroom-delivery-measurement.mjs';
import {stagingLessonScope} from './lib/staging-lesson-scope.mjs';
process.umask(0o077);
const {config,fixtures}=loadRoleFixtures(process.env.AC_ROLE_FIXTURES);
assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const baseURL=process.env.AC_ROLE_BASE_URL;
const target=new URL(baseURL);
assert.equal(target.origin,baseURL);
assert.equal(target.protocol,'https:');
assert.match(target.hostname,/^applied-commerce-sa-staging(?:-[a-z0-9-]+)?\.vercel\.app$/);
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE)).content[0].text);
const manifest=JSON.parse(fs.readFileSync('content/instructional/teaching-manifest.v2.json'));
assert.ok(process.env.AC_DELIVERY_LESSONS,'Select staging measurement lessons explicitly');
const selection=stagingLessonScope(manifest.plans,process.env.AC_DELIVERY_LESSONS);
const ids=selection.plans.map(plan=>plan.lessonId);
const concurrency=Number(process.env.AC_DELIVERY_CONCURRENCY??1);
assert.ok(Number.isInteger(concurrency)&&concurrency>=1&&concurrency<=4);
const serverMetrics=process.env.AC_DELIVERY_SERVER_METRICS==='1';
const querySuffix=serverMetrics?'&measure=1':'';
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const result={at:new Date().toISOString(),status:'RUNNING',projectRef:config.projectRef,baseURL,authentication:'genuine browser password login',measurement:'end-to-end through coding proxy; decoded response bytes; sequential phase then optional bounded concurrency',coldProcess:'NOT DEMONSTRATED',serverMemory:'NOT MEASURED',samples:[]};
try{
 const context=await browser.newContext({baseURL}),page=await context.newPage();
 await page.goto(access.shareableUrl);
 const healthResponse=await page.request.get('/api/health');assert.equal(healthResponse.status(),200);
 assert.equal(new URL(healthResponse.url()).origin,baseURL,'Deployment protection redirected the health request before application login');
 assert.match(healthResponse.headers()['content-type'],/application\/json/,'Health did not return application JSON');
 const health=await healthResponse.json();assert.equal(health.projectRef,config.projectRef);assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);result.commit=health.commit;
 const role=serverMetrics?'platformAdmin':'facilitator';result.role=role;
 await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(fixtures.users[role].email);await page.getByLabel('Password',{exact:true}).fill(fixtures.users[role].password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});
 for(const lessonId of ids)for(let request=1;request<=5;request++){
  const started=performance.now(),response=await page.request.get('/api/classroom?catalog=omit&lesson='+encodeURIComponent(lessonId)+querySuffix),body=await response.body();assert.equal(response.status(),200);
  const data=JSON.parse(body.toString()),binding=manifest.plans.find(p=>p.lessonId===lessonId);
  const planSHA256=validateDeliverySample(data,binding);
  const cache=response.headers()['cache-control'];assert.match(cache,/private/);assert.match(cache,/no-store/);
  if(serverMetrics){assert.ok(data.measurement?.memoryAfter.rss>0);assert.ok(data.measurement.teachingPlanMs>=0);result.serverMemory='hosted Node process observations; concurrent work and garbage collection included';}
  else assert.equal(data.measurement,undefined,'Normal requests must not include diagnostics');
  result.samples.push({lessonId,request,ms:Math.round(performance.now()-started),decodedBytes:body.length,cache,planSHA256,...(serverMetrics?{measurement:data.measurement}:{})});
 }
 // These low-volume overlapping requests measure observed end-to-end behaviour,
 // not throughput capacity, server process identity or a proven cold start.
 result.concurrent={concurrency,waves:[],scope:'one authenticated educator; bounded overlapping requests; no capacity claim'};
 if(concurrency>1)for(let wave=1;wave<=3;wave++){
  const started=performance.now();
  const samples=await boundedDeliveryMap(Array.from({length:concurrency},(_,index)=>ids[((wave-1)*concurrency+index)%ids.length]),concurrency,async lessonId=>{
   const start=performance.now(),response=await page.request.get('/api/classroom?catalog=omit&lesson='+encodeURIComponent(lessonId)+querySuffix),body=await response.body();
   assert.equal(response.status(),200);const data=JSON.parse(body.toString()),planSHA256=validateDeliverySample(data,manifest.plans.find(p=>p.lessonId===lessonId));
   if(serverMetrics)assert.ok(data.measurement?.memoryAfter.rss>0);
   const cache=response.headers()['cache-control'];assert.match(cache,/private/);assert.match(cache,/no-store/);
   return {lessonId,status:response.status(),ms:Math.round(performance.now()-start),decodedBytes:body.length,planSHA256,cache,...(serverMetrics?{measurement:data.measurement}:{})};
  });
  result.concurrent.waves.push({wave,wallMs:Math.round(performance.now()-started),samples});
 }
 const median=values=>{const sorted=[...values].sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2;};
 result.lessons=ids.map(lessonId=>{const rows=result.samples.filter(r=>r.lessonId===lessonId);return {lessonId,decodedBytes:rows[0].decodedBytes,firstSampleMs:rows[0].ms,repeatedMedianMs:median(rows.slice(1).map(r=>r.ms)),rangeMs:[Math.min(...rows.map(r=>r.ms)),Math.max(...rows.map(r=>r.ms))]};});
 result.status='PASS';
 fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({lessons:ids.length,requests:result.samples.length,concurrentRequests:result.concurrent.waves.reduce((n,w)=>n+w.samples.length,0),coldProcess:result.coldProcess,serverMemory:result.serverMemory}));
}catch(error){
 result.status='FAIL';result.failureType=error.name;
 fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(result,null,2)+'\n');
 throw error;
}finally{await browser.close();}
