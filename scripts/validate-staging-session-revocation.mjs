// Genuine password logins and supported Auth logout. This is session
// revocation, distinct from natural JWT expiry and cohort-role revocation.
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
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE)).content[0].text);
const result={at:new Date().toISOString(),status:'RUNNING',projectRef:config.projectRef,baseURL,
  authentication:'genuine browser and API password login',
  scope:'supported Auth global logout invalidates an existing educator browser session; fresh password login recovers access',
  naturalExpiry:'NOT TESTED by this runner',checks:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(result,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,
  proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,
  args:['--no-sandbox','--disable-dev-shm-usage']});
async function login(){
  const context=await browser.newContext({baseURL}),page=await context.newPage();
  await page.goto(access.shareableUrl);
  const healthResponse=await page.request.get('/api/health');assert.equal(healthResponse.status(),200,'Deployment access failed before application login');
  assert.equal(new URL(healthResponse.url()).origin,baseURL,'Deployment protection redirected health before application login');
  assert.match(healthResponse.headers()['content-type'],/application\/json/,'Application health JSON required');
  const health=await healthResponse.json();assert.equal(health.projectRef,config.projectRef);
  assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);result.commit=health.commit;
  await page.goto('/auth');
  await page.getByLabel('Email address',{exact:true}).fill(fixtures.users.facilitator.email);
  await page.getByLabel('Password',{exact:true}).fill(fixtures.users.facilitator.password);
  await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();
  await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});
  return {context,page};
}
try{
  const a=await login();
  await a.page.goto('/learn/8/term/1/g8-t1-l01-001');
  await a.page.getByRole('button',{name:'Teacher View',exact:true}).click();
  await a.page.locator('[data-instructional-location="preparation"]').waitFor();
  assert.equal((await a.page.request.get('/api/classroom?catalog=omit&lesson=g8-t1-l01-001')).status(),200);
  result.checks.push({operation:'existing browser authorised',status:200});save();

  // A second real Auth login supplies the logout credential; the existing
  // browser's issued cookies are left intact. No cookie or JWT is fabricated.
  const credentials=fixtures.users.facilitator;
  const auth=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',
    headers:{apikey:config.key,'Content-Type':'application/json'},
    body:JSON.stringify({email:credentials.email,password:credentials.password}),signal:AbortSignal.timeout(20000)});
  assert.equal(auth.status,200,'Supported password login failed');
  const session=await auth.json();
  const logout=await fetch(config.url+'/auth/v1/logout?scope=global',{method:'POST',
    headers:{apikey:config.key,Authorization:'Bearer '+session.access_token},signal:AbortSignal.timeout(20000)});
  assert.equal(logout.status,204,'Supported global logout failed');
  result.checks.push({operation:'supported Auth global logout',status:204});save();
  const denied=await a.page.request.get('/api/classroom?catalog=omit&lesson=g8-t1-l01-001');
  assert.equal(denied.status(),401,'Revoked browser session retained private access');
  assert.match(denied.headers()['cache-control'],/private.*no-store/);
  const body=await denied.json();assert.equal(body.plan,undefined);assert.equal(body.guide,undefined);
  result.checks.push({operation:'same browser denied without changing cookies',status:401,privatePayloadAbsent:true});save();
  await a.page.reload();
  await a.page.waitForFunction(()=>!document.querySelector('.contextual-guidance')&&!Array.from(document.querySelectorAll('button')).some(node=>node.textContent==='Teacher View'));
  result.checks.push({operation:'reload removes teacher interface',pass:true});
  await a.context.close();
  const b=await login();
  assert.equal((await b.page.request.get('/api/classroom?catalog=omit&lesson=g8-t1-l01-001')).status(),200);
  result.checks.push({operation:'fresh password login restores authorised access',status:200});
  await b.context.close();result.status='PASS';save();
  console.log(JSON.stringify({status:result.status,checks:result.checks,commit:result.commit}));
}catch(error){result.status='FAIL';result.failureType=error.name;save();throw error;}
finally{await browser.close();}
