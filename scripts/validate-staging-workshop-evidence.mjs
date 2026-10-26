// Preserve the current workshop controls and test actual saved activity evidence.
// Existing log fields are verified, never created, hidden or authenticated by mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {loadRoleFixtures} from './lib/validation-target.mjs';
import {runtimeUnits} from './semantic-census.mjs';
process.umask(0o077);
const {config,fixtures}=loadRoleFixtures(process.env.AC_ROLE_FIXTURES);
assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const baseURL=process.env.AC_ROLE_BASE_URL;assert.ok(new URL(baseURL).hostname.startsWith('applied-commerce-sa-staging'));
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE)).content[0].text);
const units=(await runtimeUnits()).filter(u=>u.grade===10&&u.term===4),learner=fixtures.users.learner;
const storage='applied-commerce-learning-state-v1:user:'+learner.id,marker='Synthetic workshop evidence '+Date.now();
const targets=[[70,13],[73,15],[74,16],[70,29]].map(([n,index])=>{const unit=units.find(u=>u.startLesson===n);assert.ok(unit);return {unit,index,block:unit.blocks[index],log:index===29};});
const results={at:new Date().toISOString(),projectRef:config.projectRef,authentication:'genuine staging password login',syntheticOnly:true,sourceChanges:false,responseStructureChanges:false,existingLogs:[],activityEvidence:[],pageErrors:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(results,null,2)+'\n');
let token,snapshot,failed;
const touched=new Set();
async function session(role='learner'){const c=fixtures.users[role],r=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:c.email,password:c.password})});assert.equal(r.status,200);return r.json();}
async function api(path,auth=token,body){const r=await fetch(config.url+path,{method:body===undefined?'GET':'POST',headers:{apikey:config.key,Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});assert.equal(r.status,200);return r.json();}
const rows=()=>api('/rest/v1/prompt_responses?select=prompt_key,response,sync_revision&learner_id=eq.'+learner.id);
async function row(key,auth=token){const r=await api('/rest/v1/prompt_responses?select=response,sync_revision&learner_id=eq.'+learner.id+'&prompt_key=eq.'+encodeURIComponent(key),auth);return r[0];}
async function cloud(key,value){for(let i=0;i<40;i++){if((await row(key))?.response===value)return;await new Promise(resolve=>setTimeout(resolve,500));}throw Error('Expected synthetic workshop value did not persist');}
async function restore(key,value){const old=await row(key),r=await api('/rest/v1/rpc/save_learning_changes_for_account',token,{p_account_id:learner.id,p_changes:[{kind:'prompt',key,value,expected:old?.sync_revision??0}]});assert.ok(r.length&&r.every(item=>!item.conflict));await cloud(key,value);}
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
async function login(){const context=await browser.newContext({baseURL}),page=await context.newPage();page.on('pageerror',error=>results.pageErrors.push(error.name));await page.goto(access.shareableUrl);const r=await page.request.get('/api/health');assert.equal(new URL(r.url()).origin,baseURL);assert.match(r.headers()['content-type']??'',/application\/json/);const h=await r.json();assert.equal(h.projectRef,config.projectRef);assert.equal(h.commit,process.env.AC_EXPECTED_COMMIT);results.commit=h.commit;await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(learner.email);await page.getByLabel('Password',{exact:true}).fill(learner.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});token=await session();return {context,page};}
async function open(page,unit){await page.goto(`/learn/10/term/4/${unit.id}`);await page.getByRole('heading',{level:1,name:unit.title,exact:true}).waitFor();await page.waitForFunction(storage=>JSON.parse(localStorage.getItem(storage)||'{}').sync?.baseline!==undefined,storage,{timeout:30000});}
function logSection(page){return page.locator('.learning-section').filter({has:page.getByRole('heading',{name:'Tension and Experiment Log',exact:true})});}
async function field(page,target){await open(page,target.unit);const control=target.log?logSection(page).getByRole('textbox').first():page.getByRole('textbox',{name:target.block.text,exact:true});await control.waitFor();assert.equal(await control.count(),1);return control;}
try{
 token=await session();snapshot=new Map((await rows()).map(r=>[r.prompt_key,r.response]));
 const a=await login();
 for(let n=70;n<=74;n++){const unit=units.find(u=>u.startLesson===n);await open(a.page,unit);const section=logSection(a.page);assert.equal(await section.count(),1);assert.equal(await section.getByRole('textbox').count(),6);results.existingLogs.push({lessonId:unit.id,headingBlockId:unit.blocks[28].id,recordBlockId:unit.blocks[29].id,existingControls:6,visible:true,newControlsAdded:0});}
 for(const [i,target] of targets.entries()){
  const input=await field(a.page,target),value=marker+' target '+i;
  await input.fill(value);
  const handle=await a.page.waitForFunction(({storage,value})=>Object.entries(JSON.parse(localStorage.getItem(storage)||'{}').promptResponses??{}).find(([,text])=>text===value)?.[0],{storage,value});
  const key=await handle.jsonValue();touched.add(key);assert.ok(key.startsWith(target.unit.id+'::prompt-'+target.block.id+'::'));await cloud(key,value);
  await input.fill(value+' edited');await cloud(key,value+' edited');await a.page.reload();assert.equal(await(await field(a.page,target)).inputValue(),value+' edited');
  await(await field(a.page,target)).fill('');await cloud(key,'');await a.page.reload();assert.equal(await(await field(a.page,target)).inputValue(),'');
  await(await field(a.page,target)).fill(value+' fresh');await cloud(key,value+' fresh');results.activityEvidence.push({lessonId:target.unit.id,blockId:target.block.id,responseKey:key,kind:target.log?'existing later-work log field':'original activity evidence',editClearReload:true});
 }
 await a.page.goto('/auth');await a.page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).click();await a.page.getByLabel('Email address',{exact:true}).waitFor();await a.context.close();
 const b=await login();for(let i=0;i<targets.length;i++){assert.equal(await(await field(b.page,targets[i])).inputValue(),marker+' target '+i+' fresh');results.activityEvidence[i].freshPasswordLogin=true;}
 await b.page.goto('/portfolio');
 for(let i=0;i<3;i++){
  const target=targets[i],artifact=b.page.locator('.portfolio-artifact').filter({has:b.page.locator(`a[href="/learn/10/term/4/${target.unit.id}"]`)});await artifact.waitFor({timeout:60000});await artifact.locator('summary').click();assert.ok((await artifact.innerText()).includes(marker+' target '+i+' fresh'));results.activityEvidence[i].actualPortfolioVisible=true;
 }
 const educator=await session('facilitator');for(let i=0;i<targets.length;i++){const item=results.activityEvidence[i];assert.equal((await row(item.responseKey,educator))?.response,marker+' target '+i+' fresh');item.assignedEducatorCanRead=true;}
 for(const role of ['other','unassigned']){const auth=await session(role);for(const item of results.activityEvidence)assert.equal(await row(item.responseKey,auth),undefined);}
 results.otherAndRevokedDenied=true;await b.context.close();assert.equal(results.pageErrors.length,0);results.status='PASS';
}catch(error){failed=error;results.status='FAIL';results.failure=error.message;}
finally{
 await browser.close();
 if(snapshot){try{token=await session();for(const r of await rows())if(typeof r.response==='string'&&r.response.startsWith(marker))touched.add(r.prompt_key);for(const key of touched){assert.ok(targets.some(t=>key.startsWith(t.unit.id+'::prompt-'+t.block.id+'::')));await restore(key,snapshot.get(key)??'');}results.originalSyntheticValuesRestored=true;}catch(error){failed??=error;results.status='FAIL';results.originalSyntheticValuesRestored=false;}}
 save();
}
if(failed)throw failed;
console.log(JSON.stringify({workshopEvidence:results.status,existingLogLessons:results.existingLogs.length,existingLogControls:results.existingLogs.reduce((n,r)=>n+r.existingControls,0),writtenJourneys:results.activityEvidence.length,actualPortfolioJourneys:3,freshLogin:true,originalsRestored:results.originalSyntheticValuesRestored}));
