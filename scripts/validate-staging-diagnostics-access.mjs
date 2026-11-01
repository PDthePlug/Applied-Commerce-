// Genuine staging role checks for optional measurement data. Run after the
// first-load measurement, so this test cannot consume that first observation.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {loadRoleFixtures} from './lib/validation-target.mjs';
process.umask(0o077);
const {config,fixtures}=loadRoleFixtures(process.env.AC_ROLE_FIXTURES);
assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const baseURL=process.env.AC_ROLE_BASE_URL,target=new URL(baseURL);
assert.equal(target.origin,baseURL);assert.equal(target.protocol,'https:');
assert.match(target.hostname,/^applied-commerce-sa-staging(?:-[a-z0-9-]+)?\.vercel\.app$/);
assert.ok(process.env.AC_EXPECTED_COMMIT&&process.env.AC_STAGING_RESULTS_FILE);
const enabled=process.env.AC_DIAGNOSTICS_EXPECT_ENABLED==='1';
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE)).content[0].text);
const result={at:new Date().toISOString(),authentication:'genuine browser password logins',projectRef:config.projectRef,baseURL,enabled,status:'RUNNING',checks:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(result,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,
  proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const [role,normalStatus]of [['platformAdmin',200],['facilitator',200],['schoolAdmin',200],['learner',403],['unassigned',403]]){
  const context=await browser.newContext({baseURL}),page=await context.newPage();
  await page.goto(access.shareableUrl);
  const healthResponse=await page.request.get('/api/health');assert.equal(healthResponse.status(),200);
  assert.equal(new URL(healthResponse.url()).origin,baseURL,'Deployment protection intercepted health');
  assert.match(healthResponse.headers()['content-type'],/application\/json/);
  const health=await healthResponse.json();assert.equal(health.projectRef,config.projectRef);assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);result.commit=health.commit;
  await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(fixtures.users[role].email);
  await page.getByLabel('Password',{exact:true}).fill(fixtures.users[role].password);
  await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();
  await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});
  const normal=await page.request.get('/api/classroom?catalog=omit&lesson=g8-t1-l12-012');assert.equal(normal.status(),normalStatus);
  assert.equal((await normal.json()).measurement,undefined,'Normal response exposed measurements');
  const measured=await page.request.get('/api/classroom?catalog=omit&lesson=g8-t1-l12-012&measure=1');
  const expected=enabled&&role==='platformAdmin'?200:403;
  assert.equal(measured.status(),expected);assert.match(measured.headers()['cache-control'],/private.*no-store/);
  const payload=await measured.json();
  if(expected===200)assert.ok(payload.measurement?.memoryAfter.rss>0);
  else{assert.equal(payload.measurement,undefined);assert.equal(payload.plan,undefined);assert.equal(payload.guide,undefined);}
  result.checks.push({role,normalStatus,measuredStatus:measured.status(),normalMeasurementAbsent:true,deniedPrivatePayloadAbsent:expected!==200});save();
  await context.close();
 }
 result.status='PASS';save();console.log(JSON.stringify({status:result.status,roles:result.checks.length,enabled}));
}catch(error){result.status='FAIL';result.failureType=error.name;save();throw error;}
finally{await browser.close();}
