// Actual three-row income audit ratings; genuine password sessions and learner RPCs.
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
const unit=(await runtimeUnits()).find(u=>u.id==='g10-t4-l61-061'),block=unit.blocks[22];
assert.equal(block.type,'table');assert.deepEqual(block.rows[0],['Stream','Monthly (Approx)','Control (1-5)','Who Can Stop This?']);
const learner=fixtures.users.learner,storage='applied-commerce-learning-state-v1:user:'+learner.id;
const keys=[1,2,3].map(row=>`${unit.id}::prompt-${block.id}::table-${row}-2`);
const result={at:new Date().toISOString(),projectRef:config.projectRef,lessonId:unit.id,blockId:block.id,responseKeys:keys,authentication:'genuine staging password login',syntheticOnly:true,pageErrors:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(result,null,2)+'\n');
let token,originals,dirty=false,failure;
async function session(role='learner'){
 const c=fixtures.users[role],r=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:c.email,password:c.password})});assert.equal(r.status,200);return r.json();
}
async function api(path,body,auth=token){const r=await fetch(config.url+path,{method:body===undefined?'GET':'POST',headers:{apikey:config.key,Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});assert.equal(r.status,200);return r.json();}
const rows=(key,auth)=>api('/rest/v1/prompt_responses?select=response,sync_revision&learner_id=eq.'+learner.id+'&prompt_key=eq.'+encodeURIComponent(key),undefined,auth);
async function write(key,value){const current=await rows(key),r=await api('/rest/v1/rpc/save_learning_changes_for_account',{p_account_id:learner.id,p_changes:[{kind:'prompt',key,value,expected:current[0]?.sync_revision??0}]});assert.ok(r.length&&r.every(row=>!row.conflict));}
async function cloud(key,value){for(let i=0;i<40;i++){if((await rows(key))[0]?.response===value)return;await new Promise(resolve=>setTimeout(resolve,500));}throw Error('Expected synthetic rating did not persist');}
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
async function login(){const context=await browser.newContext({baseURL}),page=await context.newPage();page.on('pageerror',error=>result.pageErrors.push(error.name));await page.goto(access.shareableUrl);const r=await page.request.get('/api/health');assert.equal(new URL(r.url()).origin,baseURL);assert.match(r.headers()['content-type']??'',/application\/json/);const health=await r.json();assert.equal(health.projectRef,config.projectRef);assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);result.commit=health.commit;await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(learner.email);await page.getByLabel('Password',{exact:true}).fill(learner.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});token=await session();return {context,page};}
async function open(page){await page.goto('/learn/10/term/4/'+unit.id);await page.getByRole('heading',{level:1,name:unit.title,exact:true}).waitFor();await page.waitForFunction(storage=>JSON.parse(localStorage.getItem(storage)||'{}').sync?.baseline!==undefined,storage,{timeout:30000});const table=page.locator('table').filter({has:page.getByRole('columnheader',{name:'Who Can Stop This?',exact:true})});await table.waitFor();assert.equal(await table.locator('.rating-options').count(),3);assert.equal(await table.locator('.rating-options button').count(),15);return table;}
async function check(table,values){for(let i=0;i<3;i++){const active=table.locator('.rating-options').nth(i).locator('[aria-pressed=true]');assert.equal(await active.count(),values[i]?1:0);if(values[i])assert.ok((await active.getAttribute('aria-label')).endsWith(': '+values[i]));}}
try{
 token=await session();originals=await Promise.all(keys.map(async key=>(await rows(key))[0]?.response??''));dirty=true;for(const key of keys)await write(key,'');
 const a=await login();let table=await open(a.page);const values=['1','3','5'];
 for(let i=0;i<3;i++){await table.locator('.rating-options').nth(i).getByRole('button',{name:new RegExp(': '+values[i]+'$')}).click();await cloud(keys[i],values[i]);}await check(table,values);result.threeIndependentNativeRatings=true;
 await table.locator('.rating-options').nth(1).getByRole('button',{name:/: 2$/}).click();await cloud(keys[1],'2');
 await table.locator('.rating-options').nth(1).getByRole('button',{name:/: 2$/}).click();await cloud(keys[1],'');
 await a.page.reload();table=await open(a.page);await check(table,['1','','5']);result.editClearReload=true;
 await a.page.goto('/auth');await a.page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).click();await a.page.getByLabel('Email address',{exact:true}).waitFor();await a.context.close();
 const b=await login();table=await open(b.page);await check(table,['1','','5']);result.freshPasswordLogin=true;
 await table.locator('.rating-options').nth(1).getByRole('button',{name:/: 4$/}).click();await cloud(keys[1],'4');await check(table,['1','4','5']);
 const educator=await session('facilitator');for(let i=0;i<3;i++)assert.equal((await rows(keys[i],educator))[0]?.response,['1','4','5'][i]);result.assignedEducatorCanReadEachRating=true;
 for(const role of ['other','unassigned'])for(const key of keys)assert.equal((await rows(key,await session(role))).length,0);result.otherAndRevokedDenied=true;
 await b.context.close();assert.equal(result.pageErrors.length,0);result.status='PASS';
}catch(error){failure=error;result.status='FAIL';result.failure=error.message;}
finally{await browser.close();if(dirty&&originals){try{token=await session();for(let i=0;i<3;i++){await write(keys[i],originals[i]);await cloud(keys[i],originals[i]);}result.originalSyntheticValuesRestored=true;}catch(error){failure??=error;result.status='FAIL';result.originalSyntheticValuesRestored=false;}}save();}
if(failure)throw failure;
console.log(JSON.stringify({incomeRatings:result.status,nativeRatings:3,independent:true,freshLogin:true,scopedReview:true,originalsRestored:result.originalSyntheticValuesRestored}));
