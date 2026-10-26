// Genuine synthetic-account validation of the separately approved Lesson 60 fix.
// Fixture credentials/captures stay protected. No role interception or Auth SQL.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {chromium} from '@playwright/test';
import {loadRoleFixtures} from './lib/validation-target.mjs';
import {runtimeUnits} from './semantic-census.mjs';
import {renderModule} from '../tests/lib/render-module.mjs';
process.umask(0o077);
const {config,fixtures}=loadRoleFixtures(process.env.AC_ROLE_FIXTURES);
assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const baseURL=process.env.AC_ROLE_BASE_URL;
assert.ok(new URL(baseURL).hostname.startsWith('applied-commerce-sa-staging'));
const expectedCommit=process.env.AC_EXPECTED_COMMIT;
assert.match(expectedCommit,/^[a-f0-9]{40}$/);
const dir=process.env.AC_STAGING_EVIDENCE_DIR;
assert.ok(dir?.startsWith(process.env.AC_ROLE_FIXTURES+'/'));
fs.mkdirSync(dir,{recursive:true,mode:0o700});
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE)).content[0].text);
const h=await import(renderModule('lib/horizon-response.ts'));
const unit=(await runtimeUnits()).find(u=>u.id==='g10-t4-l60-060');
assert.equal(unit.blocks[38].id,'dfe0b8dcfd78fcd81bea25f0-1');
const key=h.horizonResponseKey,learner=fixtures.users.learner;
const storage='applied-commerce-learning-state-v1:user:'+learner.id;
const result={at:new Date().toISOString(),projectRef:config.projectRef,commit:expectedCommit,lessonId:unit.id,responseKey:key,authentication:'genuine staging password login',syntheticOnly:true,sourceChanges:false,responseIdentityChanges:false,responsive:[],pageErrors:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(result,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
let verificationSession,original,dirty=false,failure;
async function session(credentials){
  const response=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:credentials.email,password:credentials.password})});
  assert.equal(response.status,200,'Genuine Auth password login failed');return response.json();
}
async function api(path,token,body){
  const response=await fetch(config.url+path,{method:body===undefined?'GET':'POST',headers:{apikey:config.key,Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  assert.equal(response.status,200,'Staging data operation failed');return response.json();
}
const rows=token=>api('/rest/v1/prompt_responses?select=response,sync_revision&learner_id=eq.'+learner.id+'&prompt_key=eq.'+encodeURIComponent(key),token);
async function write(value){
  const old=await rows(verificationSession);
  const response=await api('/rest/v1/rpc/save_learning_changes_for_account',verificationSession,{p_account_id:learner.id,p_changes:[{kind:'prompt',key,value,expected:old[0]?.sync_revision??0}]});
  assert.ok(response.length&&response.every(row=>!row.conflict),'Revision-checked synthetic save failed');
}
async function cloud(value){
  for(let i=0;i<40;i++){if((await rows(verificationSession))[0]?.response===value)return;await new Promise(resolve=>setTimeout(resolve,500));}
  throw Error('Expected synthetic horizon response did not persist');
}
async function login(credentials=learner){
  const context=await browser.newContext({baseURL,viewport:{width:1280,height:1000}}),page=await context.newPage();
  page.on('pageerror',error=>result.pageErrors.push(error.name));
  await page.goto(access.shareableUrl);
  const response=await page.request.get('/api/health');
  assert.equal(new URL(response.url()).origin,baseURL,'Deployment protection failed before application login');
  assert.match(response.headers()['content-type']??'',/application\/json/);
  const health=await response.json();assert.equal(health.projectRef,config.projectRef);assert.equal(health.commit,expectedCommit);
  await page.goto('/auth');
  await page.getByLabel('Email address',{exact:true}).fill(credentials.email);
  await page.getByLabel('Password',{exact:true}).fill(credentials.password);
  await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();
  await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});
  return {context,page};
}
async function open(page){
  await page.goto('/learn/10/term/4/'+unit.id);
  await page.getByRole('heading',{level:1,name:unit.title,exact:true}).waitFor();
  await page.waitForFunction(storage=>JSON.parse(localStorage.getItem(storage)||'{}').sync?.baseline!==undefined,storage,{timeout:30000});
  await page.locator('.horizon-choice').first().waitFor();
  assert.equal(await page.locator('.horizon-choice').count(),4);assert.equal(await page.locator('.horizon-options input[type=radio]').count(),24);
}
const group=(page,label)=>page.getByRole('group',{name:label+':',exact:true});
async function check(page,answers){
  for(const label of h.financialHorizons){
    const checked=group(page,label).locator('input:checked');
    assert.equal(await checked.count(),answers[label]?1:0);
    if(answers[label])assert.equal(await checked.inputValue(),answers[label]);
  }
}
async function logout({context,page}){
  await page.goto('/auth');await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).click();
  await page.getByLabel('Email address',{exact:true}).waitFor();await context.close();
}
async function educatorReview(expected){
  const educator=await session(fixtures.users.facilitator);
  assert.equal((await rows(educator))[0]?.response,expected);
  const a=await login(fixtures.users.facilitator);
  await a.page.goto('/facilitator/review?learner='+learner.id);
  await a.page.getByPlaceholder('Search evidence',{exact:true}).fill('Financial Independence');
  const entry=a.page.locator('.fac-review-list button').filter({has:a.page.locator('strong').filter({hasText:/^Now:/})});
  await entry.waitFor({timeout:60000});await entry.click();
  const displayed=a.page.locator('.fac-source-context>div').nth(1).locator('p');
  assert.equal(await displayed.innerText(),h.displayHorizonResponse(key,expected));
  assert.ok(!(await displayed.innerText()).includes('ac_horizon_choices_v1'));
  await a.page.locator('.fac-source-context').screenshot({path:dir+'/educator-readable-response.png'});
  await a.context.close();result.assignedEducatorActualUIAndRawEvidence=true;
}
try{
  verificationSession=await session(learner);original=(await rows(verificationSession))[0]?.response??'';dirty=true;await write('');
  const a=await login();await open(a.page);await check(a.page,{});
  assert.equal(await a.page.getByRole('button',{name:'Teacher View',exact:true}).count(),0);
  let value='';const choices=['Dependent','Stable','Secure','Independent'];
  for(let i=0;i<h.financialHorizons.length;i++){
    const label=h.financialHorizons[i],option=choices[i];
    await group(a.page,label).getByRole('radio',{name:option,exact:true}).check();
    value=h.changeHorizonResponse(value,label,option);await cloud(value);await check(a.page,h.readHorizonResponse(value).answers);
  }
  result.independentChoices=true;
  await group(a.page,'Now').getByRole('radio',{name:'Dependent',exact:true}).focus();await a.page.keyboard.press('ArrowRight');
  value=h.changeHorizonResponse(value,'Now','Surviving');await cloud(value);
  await group(a.page,'20 years').getByRole('button',{name:'Clear 20 years selection',exact:true}).click();
  value=h.changeHorizonResponse(value,'20 years','');await cloud(value);
  await a.page.reload();await open(a.page);await check(a.page,h.readHorizonResponse(value).answers);
  result.keyboardEditAndIndividualClearReload=true;await logout(a);
  const b=await login();await open(b.page);await check(b.page,h.readHorizonResponse(value).answers);result.freshPasswordLogin=true;
  await group(b.page,'20 years').getByRole('radio',{name:'Secure',exact:true}).check();value=h.changeHorizonResponse(value,'20 years','Secure');await cloud(value);
  for(const width of [320,360,430,768,1280,1920])for(const scale of [1,1.28,2]){
    await b.page.setViewportSize({width,height:1000});await b.page.evaluate(scale=>document.documentElement.style.setProperty('--ac-text-scale',String(scale)),scale);
    const overflow=await b.page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
    result.responsive.push({width,scale,overflow});
    if((width===320&&[1,2].includes(scale))||(width===1280&&scale===1))await b.page.locator('.horizon-choices').screenshot({path:dir+`/four-horizons-${width}-${scale}.png`,animations:'disabled'});
  }
  await b.page.setViewportSize({width:1280,height:1000});await b.page.evaluate(()=>document.documentElement.style.setProperty('--ac-text-scale','1'));
  await educatorReview(value);
  for(const role of ['other','unassigned']){assert.equal((await rows(await session(fixtures.users[role]))).length,0);result[role==='other'?'otherLearnerDenied':'revokedEducatorDenied']=true;}
  const boundary=JSON.parse(fs.readFileSync(process.env.AC_ROLE_FIXTURES+'/boundary.json'));assert.equal(boundary.projectRef,config.projectRef);assert.equal(boundary.run,fixtures.run);
  assert.equal((await rows(await session(boundary.user))).length,0);result.unrelatedInstitutionStaffDenied=true;
  for(const label of h.financialHorizons){
    await group(b.page,label).getByRole('button',{name:`Clear ${label} selection`,exact:true}).click();
    value=h.changeHorizonResponse(value,label,'');await cloud(value);
  }
  assert.equal(value,'');await b.page.reload();await open(b.page);await check(b.page,{});await logout(b);
  const empty=await login();await open(empty.page);await check(empty.page,{});await empty.context.close();
  result.clearAllWithoutLegacyReloadAndFreshLogin=true;
  const legacy='Dependent\nAbundant 10 years:\nSynthetic retained horizon note';await write(legacy);
  const c=await login();await open(c.page);await check(c.page,{});
  await c.page.locator('.horizon-choices summary').click();assert.equal(await c.page.locator('.horizon-choices details p').innerText(),legacy);
  await group(c.page,'10 years').getByRole('radio',{name:'Stable',exact:true}).check();value=h.changeHorizonResponse(legacy,'10 years','Stable');await cloud(value);
  await c.page.reload();await open(c.page);await check(c.page,{'10 years':'Stable'});await logout(c);
  const d=await login();await open(d.page);await check(d.page,{'10 years':'Stable'});
  await d.page.locator('.horizon-choices summary').click();assert.equal(await d.page.locator('.horizon-choices details p').innerText(),legacy);
  result.previousCombinedVerbatimAndFreshLogin=true;
  await d.page.pdf({path:dir+'/learner-horizons-and-retained-answer.pdf',format:'A4',printBackground:true});
  execFileSync('pdftotext',['-layout',dir+'/learner-horizons-and-retained-answer.pdf',dir+'/learner-horizons-and-retained-answer.txt']);
  const pdf=fs.readFileSync(dir+'/learner-horizons-and-retained-answer.txt','utf8');assert.match(pdf,/Stable\s+\(selected\)/);assert.match(pdf,/Synthetic retained horizon note/);assert.ok(!pdf.includes('ac_horizon_choices_v1'));result.physicalPrintSelectionsAndPreviousAnswer=true;
  await d.page.goto('/portfolio');
  const artifact=d.page.locator('.portfolio-artifact').filter({has:d.page.locator('a[href="/learn/10/term/4/'+unit.id+'"]')});
  await artifact.waitFor({timeout:60000});await artifact.locator('summary').click();
  const expected=h.displayHorizonResponse(key,value);assert.ok((await artifact.innerText()).includes(expected));assert.ok(!(await artifact.innerText()).includes('ac_horizon_choices_v1'));
  await artifact.screenshot({path:dir+'/portfolio-readable-retained-answer.png'});result.actualPortfolioReadable=true;
  await educatorReview(value);
  await open(d.page);await group(d.page,'10 years').getByRole('button',{name:'Clear 10 years selection',exact:true}).click();await cloud(legacy);
  await d.page.reload();await open(d.page);await check(d.page,{});result.clearAllNewChoicesRetainsExactOlderString=true;await logout(d);
  const e=await login();await open(e.page);await check(e.page,{});await e.page.locator('.horizon-choices summary').click();assert.equal(await e.page.locator('.horizon-choices details p').innerText(),legacy);result.clearedStateAndLegacyFreshLogin=true;await e.context.close();
  assert.equal(result.pageErrors.length,0);result.status='PASS';
}catch(error){failure=error;result.status='FAIL';result.failure=error.message;}
finally{
  await browser.close();
  if(dirty&&original!==undefined){try{verificationSession=await session(learner);await write(original);await cloud(original);result.originalSyntheticResponseRestored=true;}catch(error){failure??=error;result.status='FAIL';result.originalSyntheticResponseRestored=false;}}
  save();
}
if(failure)throw failure;
console.log(JSON.stringify({genuineHorizonValidation:result.status,independentChoices:true,previousCombinedRetained:true,freshLogin:true,scopedReview:true,physicalPrint:true,responsive:result.responsive.length,originalRestored:result.originalSyntheticResponseRestored}));
