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
const defaultTargets=[
 ['g8-t3-l48-047','10f28b8372cac328e6fba183-1'],
 ['g9-t1-l08-008','f72bbea833b0aa9358587c0c-1'],
 ['g9-t2-l24-025','416787d6dfc7c06a91e6b516-1'],
 ['g9-t2-l25-026','291880c52925d6231737ea15-1'],
 ['g9-t3-l38-027','83e8f6a3a4e6a8dab8513116-1'],
 ['g9-t3-l40-029','c87a9ed047a14279252f9c37-1'],
 ['g9-t3-l43-032','2484c5d0ddb94968b6e7fd38-1'],
 ['g12-t1-l05-005','5f0c22bc894983d67228d043-1'],
 ['g12-t1-l05-005','c867069c610f02cce9d8979f-1'],
].map(([lessonId,blockId])=>({lessonId,blockId}));
const specs=process.env.AC_TABLE_TARGET_FILE?JSON.parse(fs.readFileSync(process.env.AC_TABLE_TARGET_FILE)):defaultTargets;
assert.ok(Array.isArray(specs)&&specs.length);
assert.equal(new Set(specs.map(s=>s.lessonId+'::'+s.blockId)).size,specs.length);
const targets=specs.map(({lessonId,blockId,expectedLocalControls,expectedLocalRows})=>{const unit=units.find(u=>u.id===lessonId);assert.ok(unit?.type==='lesson');const index=unit.blocks.findIndex(b=>b.id===blockId);assert.ok(index>=0&&unit.blocks[index].type==='table');return {unit,block:unit.blocks[index],index,expectedLocalControls,expectedLocalRows};});
const results={at:new Date().toISOString(),projectRef:config.projectRef,authentication:'genuine staging password login',localEvidence:'actual ContentBlocks SSR; empty response state',hostedEvidence:'unintercepted authenticated rendered learner lesson',syntheticPersistence:persist,tables:[],pageErrors:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(results,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
async function tableFor(page,headers,occurrence=0){await page.locator('table').first().waitFor({timeout:60000});const tables=page.locator('table');for(let i=0;i<await tables.count();i++){const table=tables.nth(i);if(JSON.stringify(await table.locator('thead th').allTextContents())===JSON.stringify(headers)&&occurrence--===0)return table;}throw Error('Expected exact source table absent');}
const route=unit=>`/learn/${unit.grade}/term/${unit.term}/${unit.id}`;
const credentials=fixtures.users.learner;
const storage='applied-commerce-learning-state-v1:user:'+credentials.id;
const baseline=page=>page.waitForFunction(storage=>JSON.parse(localStorage.getItem(storage)||'{}').sync?.baseline!==undefined,storage,{timeout:30000});
async function login(){const context=await browser.newContext({baseURL,viewport:{width:1280,height:900}}),page=await context.newPage();page.on('pageerror',e=>results.pageErrors.push(e.name));await page.goto(access.shareableUrl);const response=await page.request.get('/api/health');assert.equal(new URL(response.url()).origin,baseURL,'Deployment protection redirected before application authentication');assert.equal(response.status(),200,'Deployment health failed before application authentication');assert.match(response.headers()['content-type']??'',/application\/json/,'Deployment protection/health returned non-JSON before application authentication');const health=await response.json();assert.equal(health.projectRef,config.projectRef);assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);results.commit=health.commit;await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(credentials.email);await page.getByLabel('Password',{exact:true}).fill(credentials.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});return {context,page};}
let session;
async function passwordSession(){const r=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:credentials.email,password:credentials.password})});assert.equal(r.status,200);session=await r.json();}
async function cloud(key){const r=await fetch(config.url+'/rest/v1/prompt_responses?select=response&learner_id=eq.'+credentials.id+'&prompt_key=eq.'+encodeURIComponent(key),{headers:{apikey:config.key,Authorization:'Bearer '+session.access_token}});assert.equal(r.status,200);return (await r.json())[0]?.response;}
async function waitCloud(key,value){for(let i=0;i<40;i++){if(await cloud(key)===value)return;await new Promise(r=>setTimeout(r,500));}throw Error('Synthetic table response did not persist');}
try{
 if(persist)await passwordSession();
 const local=await browser.newPage();const a=await login();const written=[],writtenRatings=[];
 for(const {unit,block,index,expectedLocalControls,expectedLocalRows} of targets){
  const headers=block.rows[0],occurrence=unit.blocks.slice(0,index).filter(b=>b.type==='table'&&JSON.stringify(b.rows[0])===JSON.stringify(headers)).length;await local.setContent(renderToStaticMarkup(React.createElement(ContentBlocks,{blocks:unit.blocks,unitId:unit.id,unitType:unit.type,promptResponses:{},onSavePromptResponse:()=>{}})));
  const ssr=await tableFor(local,headers,occurrence),localRows=await ssr.locator('tbody tr').count(),localControls=await ssr.getByRole('textbox').count(),localRatings=await ssr.locator('.rating-control').count();
  if(expectedLocalControls!==undefined)assert.equal(localControls,expectedLocalControls,'Reviewed table control count differs');
  if(expectedLocalRows!==undefined)assert.equal(localRows,expectedLocalRows,'Reviewed source-derived row count differs');
  await a.page.goto(route(unit));await baseline(a.page);await a.page.getByRole('heading',{level:1,name:unit.title,exact:true}).waitFor();const table=await tableFor(a.page,headers,occurrence),hostedRows=await table.locator('tbody tr').count(),hostedControls=await table.getByRole('textbox').count(),hostedRatings=await table.locator('.rating-control').count();
  assert.ok(hostedRows>=localRows);assert.ok(hostedControls>=localControls);
  if(block.rows.length>1)assert.equal(hostedControls,localControls,'Fixed source table control count changed');
  const row={lessonId:unit.id,blockId:block.id,sourceUnitSHA256:digest(unit),sourceTableRows:block.rows.length,headerOnly:block.rows.length===1,localRows,localControls,localRatings,hostedRows,hostedControls,hostedRatings,addRowAvailable:await table.locator('..').getByRole('button',{name:'Add another row',exact:true}).count()===1};
  if(row.headerOnly){if(expectedLocalRows===undefined)assert.ok(localRows>=3);else assert.ok(localRows>=1);assert.equal(localControls+localRatings,localRows*headers.length,'Generated cells include text or authored rating controls');assert.equal(hostedControls+hostedRatings,hostedRows*headers.length);assert.equal(row.addRowAvailable,true);}
  if(unit.id==='g9-t2-l25-026')assert.equal(hostedControls,0);
  if(persist&&hostedControls){const input=table.getByRole('textbox').first(),original=await input.inputValue(),marker='Synthetic table audit '+unit.id+' '+Date.now();await input.fill(marker);const handle=await a.page.waitForFunction(({storage,marker})=>Object.entries(JSON.parse(localStorage.getItem(storage)||'{}').promptResponses??{}).find(([,v])=>v===marker)?.[0],{storage,marker});const responseKey=await handle.jsonValue();assert.ok(responseKey.startsWith(unit.id+'::prompt-'+block.id+'::'));await waitCloud(responseKey,marker);await input.fill(marker+' edited');await waitCloud(responseKey,marker+' edited');await a.page.reload();await baseline(a.page);assert.equal(await (await tableFor(a.page,headers,occurrence)).getByRole('textbox').first().inputValue(),marker+' edited');await(await tableFor(a.page,headers,occurrence)).getByRole('textbox').first().fill('');await waitCloud(responseKey,'');await a.page.reload();await baseline(a.page);assert.equal(await(await tableFor(a.page,headers,occurrence)).getByRole('textbox').first().inputValue(),'');await(await tableFor(a.page,headers,occurrence)).getByRole('textbox').first().fill(marker+' fresh');await waitCloud(responseKey,marker+' fresh');written.push({unit,headers,occurrence,original,responseKey,marker:marker+' fresh',row});row.editClearReload=true;row.responseKey=responseKey;}
  if(persist&&hostedRatings){
   const rating=table.locator('.rating-control').first(),position=await rating.evaluate(n=>{const td=n.closest('td');return {row:td.parentElement.sectionRowIndex+1,column:td.cellIndex};}),key=unit.id+'::prompt-'+block.id+`::table-${position.row}-${position.column}`,original=await cloud(key)??'';
   if(original===''||await rating.getByRole('button').filter({hasText:new RegExp('^'+original+'$')}).count()===1){
    const value=original==='1'?'2':'1',choose=async(target,v)=>target.getByRole('button',{name:(await target.getByRole('group').getAttribute('aria-label'))+': '+v,exact:true});await(await choose(rating,value)).click();await waitCloud(key,value);await a.page.reload();await baseline(a.page);let current=(await tableFor(a.page,headers,occurrence)).locator('.rating-control').first();assert.equal(await(await choose(current,value)).getAttribute('aria-pressed'),'true');await(await choose(current,value)).click();await waitCloud(key,'');await a.page.reload();await baseline(a.page);current=(await tableFor(a.page,headers,occurrence)).locator('.rating-control').first();assert.equal(await current.locator('[aria-pressed="true"]').count(),0);await(await choose(current,value)).click();await waitCloud(key,value);writtenRatings.push({unit,headers,occurrence,key,original,value,row});row.ratingEditClearReload=true;row.ratingResponseKey=key;
   }else row.ratingPreservedLegacyValue=true;
  }
  results.tables.push(row);save();
 }
 await local.close();await a.page.goto('/auth');await a.page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).click();await a.page.getByLabel('Email address',{exact:true}).waitFor();await a.context.close();
 // Browser logout revokes the separate API verification session too. Renew it
 // by genuine password login before checking restoration; a denied/absent row
 // must never be accepted as an empty saved answer.
 if(persist){const b=await login();await passwordSession();for(const item of written){await b.page.goto(route(item.unit));await baseline(b.page);const input=(await tableFor(b.page,item.headers,item.occurrence)).getByRole('textbox').first();assert.equal(await input.inputValue(),item.marker);item.row.freshPasswordLogin=true;await input.fill(item.original);await waitCloud(item.responseKey,item.original);item.row.originalSyntheticValueRestored=true;save();}for(const item of writtenRatings){await b.page.goto(route(item.unit));await baseline(b.page);const rating=(await tableFor(b.page,item.headers,item.occurrence)).locator('.rating-control').first(),label=await rating.getByRole('group').getAttribute('aria-label');assert.equal(await rating.getByRole('button',{name:label+': '+item.value,exact:true}).getAttribute('aria-pressed'),'true');item.row.ratingFreshPasswordLogin=true;await rating.getByRole('button',{name:label+': '+(item.original||item.value),exact:true}).click();await waitCloud(item.key,item.original);item.row.originalRatingValueRestored=true;save();}await b.context.close();}
 assert.equal(results.pageErrors.length,0);save();console.log(JSON.stringify({tables:results.tables.length,generatedEditableTables:results.tables.filter(t=>t.headerOnly).length,persistedTables:results.tables.filter(t=>t.freshPasswordLogin).length,commit:results.commit}));
}catch(error){results.failure=error.message;save();throw error;}finally{await browser.close();}
