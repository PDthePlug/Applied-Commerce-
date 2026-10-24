// Actual renderer + genuine staging audit. Never infer response rows from raw
// table shape alone. Synthetic writes use the ordinary learner save path.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {chromium} from '@playwright/test';
import {renderModule} from '../tests/lib/render-module.mjs';
import {runtimeUnits} from './semantic-census.mjs';
import {digest} from './classroom-inventory.mjs';
import {loadRoleFixtures} from './lib/validation-target.mjs';
process.umask(0o077);
const {config,fixtures}=loadRoleFixtures(process.env.AC_ROLE_FIXTURES);
assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const baseURL=process.env.AC_ROLE_BASE_URL;
assert.ok(new URL(baseURL).hostname.startsWith('applied-commerce-sa-staging'));
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE)).content[0].text);
const {ContentBlocks}=await import(renderModule('components/content-blocks.tsx'));
const units=await runtimeUnits(),persist=process.env.AC_TABLE_PERSISTENCE==='1';
const targets=[
 ['g8-t3-l48-047','10f28b8372cac328e6fba183-1'],
 ['g9-t1-l08-008','f72bbea833b0aa9358587c0c-1'],
 ['g9-t2-l24-025','416787d6dfc7c06a91e6b516-1'],
 ['g9-t2-l25-026','291880c52925d6231737ea15-1'],
 ['g9-t3-l38-027','83e8f6a3a4e6a8dab8513116-1'],
 ['g9-t3-l40-029','c87a9ed047a14279252f9c37-1'],
 ['g9-t3-l43-032','2484c5d0ddb94968b6e7fd38-1'],
 ['g12-t1-l05-005','5f0c22bc894983d67228d043-1'],
 ['g12-t1-l05-005','c867069c610f02cce9d8979f-1'],
].map(([lessonId,blockId])=>{const unit=units.find(u=>u.id===lessonId),index=unit.blocks.findIndex(b=>b.id===blockId);assert.ok(index>=0);return {unit,block:unit.blocks[index],index};});
const results={at:new Date().toISOString(),projectRef:config.projectRef,authentication:'genuine staging password login',localEvidence:'actual ContentBlocks SSR; empty response state',hostedEvidence:'unintercepted authenticated rendered learner lesson',syntheticPersistence:persist,tables:[],pageErrors:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(results,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
async function tableFor(page,headers,occurrence=0){const tables=page.locator('table');for(let i=0;i<await tables.count();i++){const table=tables.nth(i);if(JSON.stringify(await table.locator('thead th').allTextContents())===JSON.stringify(headers)&&occurrence--===0)return table;}throw Error('Expected exact source table absent');}
const route=unit=>`/learn/${unit.grade}/term/${unit.term}/${unit.id}`;
const credentials=fixtures.users.learner;
const storage='applied-commerce-learning-state-v1:user:'+credentials.id;
const baseline=page=>page.waitForFunction(storage=>JSON.parse(localStorage.getItem(storage)||'{}').sync?.baseline!==undefined,storage,{timeout:30000});
async function login(){const context=await browser.newContext({baseURL,viewport:{width:1280,height:900}}),page=await context.newPage();page.on('pageerror',e=>results.pageErrors.push(e.name));await page.goto(access.shareableUrl);const health=await(await page.request.get('/api/health')).json();assert.equal(health.projectRef,config.projectRef);assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);results.commit=health.commit;await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(credentials.email);await page.getByLabel('Password',{exact:true}).fill(credentials.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});return {context,page};}
let session;
async function cloud(key){const r=await fetch(config.url+'/rest/v1/prompt_responses?select=response&learner_id=eq.'+credentials.id+'&prompt_key=eq.'+encodeURIComponent(key),{headers:{apikey:config.key,Authorization:'Bearer '+session.access_token}});assert.equal(r.status,200);return (await r.json())[0]?.response??'';}
async function waitCloud(key,value){for(let i=0;i<40;i++){if(await cloud(key)===value)return;await new Promise(r=>setTimeout(r,500));}throw Error('Synthetic table response did not persist');}
try{
 if(persist){const r=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:credentials.email,password:credentials.password})});assert.equal(r.status,200);session=await r.json();}
 const local=await browser.newPage();const a=await login();const written=[];
 for(const {unit,block,index} of targets){
  const headers=block.rows[0],occurrence=unit.blocks.slice(0,index).filter(b=>b.type==='table'&&JSON.stringify(b.rows[0])===JSON.stringify(headers)).length;await local.setContent(renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:unit.blocks,unitId:unit.id,unitType:unit.type,promptResponses:{},onSavePromptResponse:()=>{}})));
  const ssr=await tableFor(local,headers,occurrence),localRows=await ssr.locator('tbody tr').count(),localControls=await ssr.getByRole('textbox').count();
  await a.page.goto(route(unit));await baseline(a.page);await a.page.getByRole('heading',{level:1,name:unit.title,exact:true}).waitFor();const table=await tableFor(a.page,headers,occurrence),hostedRows=await table.locator('tbody tr').count(),hostedControls=await table.getByRole('textbox').count();
  assert.ok(hostedRows>=localRows);assert.ok(hostedControls>=localControls);
  const row={lessonId:unit.id,blockId:block.id,sourceUnitSHA256:digest(unit),sourceTableRows:block.rows.length,headerOnly:block.rows.length===1,localRows,localControls,hostedRows,hostedControls,addRowAvailable:await table.locator('..').getByRole('button',{name:'Add another row',exact:true}).count()===1};
  if(row.headerOnly){assert.ok(localRows>=3);assert.equal(localControls,localRows*headers.length);assert.equal(row.addRowAvailable,true);}
  if(unit.id==='g9-t2-l25-026')assert.equal(hostedControls,0);
  if(persist&&hostedControls){const input=table.getByRole('textbox').first(),original=await input.inputValue(),marker='Synthetic table audit '+unit.id+' '+Date.now();await input.fill(marker);const handle=await a.page.waitForFunction(({storage,marker})=>Object.entries(JSON.parse(localStorage.getItem(storage)||'{}').promptResponses??{}).find(([,v])=>v===marker)?.[0],{storage,marker});const responseKey=await handle.jsonValue();assert.ok(responseKey.startsWith(unit.id+'::prompt-'+block.id+'::'));await waitCloud(responseKey,marker);await input.fill(marker+' edited');await waitCloud(responseKey,marker+' edited');await a.page.reload();await baseline(a.page);assert.equal(await (await tableFor(a.page,headers,occurrence)).getByRole('textbox').first().inputValue(),marker+' edited');await(await tableFor(a.page,headers,occurrence)).getByRole('textbox').first().fill('');await waitCloud(responseKey,'');await a.page.reload();await baseline(a.page);assert.equal(await(await tableFor(a.page,headers,occurrence)).getByRole('textbox').first().inputValue(),'');await(await tableFor(a.page,headers,occurrence)).getByRole('textbox').first().fill(marker+' fresh');await waitCloud(responseKey,marker+' fresh');written.push({unit,headers,occurrence,original,responseKey,marker:marker+' fresh',row});row.editClearReload=true;row.responseKey=responseKey;}
  results.tables.push(row);save();
 }
 await local.close();await a.page.goto('/auth');await a.page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).click();await a.page.getByLabel('Email address',{exact:true}).waitFor();await a.context.close();
 if(persist){const b=await login();for(const item of written){await b.page.goto(route(item.unit));await baseline(b.page);const input=(await tableFor(b.page,item.headers,item.occurrence)).getByRole('textbox').first();assert.equal(await input.inputValue(),item.marker);item.row.freshPasswordLogin=true;await input.fill(item.original);await waitCloud(item.responseKey,item.original);item.row.originalSyntheticValueRestored=true;save();}await b.context.close();}
 assert.equal(results.pageErrors.length,0);save();console.log(JSON.stringify({tables:results.tables.length,generatedEditableTables:results.tables.filter(t=>t.headerOnly).length,persistedTables:results.tables.filter(t=>t.freshPasswordLogin).length,commit:results.commit}));
}catch(error){results.failure=error.message;save();throw error;}finally{await browser.close();}
