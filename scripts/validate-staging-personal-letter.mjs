// Genuine synthetic learner writing and scoped educator review. No Auth mocks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {runtimeUnits} from './semantic-census.mjs';
import {loadRoleFixtures} from './lib/validation-target.mjs';
process.umask(0o077);
const {config,fixtures}=loadRoleFixtures(process.env.AC_ROLE_FIXTURES);
assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const baseURL=process.env.AC_ROLE_BASE_URL;
assert.ok(new URL(baseURL).hostname.startsWith('applied-commerce-sa-staging'));
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE)).content[0].text);
const unit=(await runtimeUnits()).find(u=>u.id===(process.env.AC_LETTER_LESSON_ID??'g9-t4-l74-064'));
assert.ok(unit?.type==='lesson');
const block=process.env.AC_LETTER_BLOCK_ID?unit.blocks.find(b=>b.id===process.env.AC_LETTER_BLOCK_ID):unit.blocks[24];
assert.equal(block?.type,'paragraph');assert.match(block.text,/^(?:Write a letter|End with:)/);
const credentials=fixtures.users.learner,storage='applied-commerce-learning-state-v1:user:'+credentials.id;
const results={at:new Date().toISOString(),projectRef:config.projectRef,lessonId:unit.id,blockId:block.id,authentication:'genuine staging password login',syntheticEvidenceOnly:true,pageErrors:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(results,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
async function session(role){const c=fixtures.users[role],r=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:c.email,password:c.password})});assert.equal(r.status,200);return r.json();}
let verificationSession;
async function read(key,token){const r=await fetch(config.url+'/rest/v1/prompt_responses?select=response&learner_id=eq.'+credentials.id+'&prompt_key=eq.'+encodeURIComponent(key),{headers:{apikey:config.key,Authorization:'Bearer '+token.access_token}});assert.equal(r.status,200);return r.json();}
async function cloud(key,value){for(let i=0;i<40;i++){if((await read(key,verificationSession))[0]?.response===value)return;await new Promise(r=>setTimeout(r,500));}throw Error('Expected synthetic letter cloud value absent');}
async function login(){const context=await browser.newContext({baseURL}),page=await context.newPage();page.on('pageerror',e=>results.pageErrors.push(e.name));await page.goto(access.shareableUrl);const r=await page.request.get('/api/health');assert.equal(new URL(r.url()).origin,baseURL,'Deployment protection redirected before application authentication');assert.match(r.headers()['content-type']??'',/application\/json/);const h=await r.json();assert.equal(h.projectRef,config.projectRef);assert.equal(h.commit,process.env.AC_EXPECTED_COMMIT);results.commit=h.commit;await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(credentials.email);await page.getByLabel('Password',{exact:true}).fill(credentials.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});return {context,page};}
async function open(page){await page.goto(`/learn/${unit.grade}/term/${unit.term}/${unit.id}`);await page.getByRole('heading',{level:1,name:unit.title,exact:true}).waitFor();await page.waitForFunction(storage=>JSON.parse(localStorage.getItem(storage)||'{}').sync?.baseline!==undefined,storage,{timeout:30000});const input=page.getByRole('textbox',{name:block.text,exact:true});await input.waitFor();assert.equal(await input.count(),1,'Existing letter control must remain singular');return input;}
try{
 verificationSession=await session('learner');const a=await login(),input=await open(a.page),original=await input.inputValue(),marker='Synthetic future-self letter '+Date.now();await input.fill(marker);const handle=await a.page.waitForFunction(({storage,marker})=>Object.entries(JSON.parse(localStorage.getItem(storage)||'{}').promptResponses??{}).find(([,v])=>v===marker)?.[0],{storage,marker}),key=await handle.jsonValue();assert.ok(key.startsWith(unit.id+'::prompt-'+block.id+'::'));results.responseKey=key;await cloud(key,marker);await input.fill(marker+' edited');await cloud(key,marker+' edited');await a.page.reload();const reloaded=await open(a.page);assert.equal(await reloaded.inputValue(),marker+' edited');await reloaded.fill('');await cloud(key,'');await a.page.reload();assert.equal(await(await open(a.page)).inputValue(),'');await(await open(a.page)).fill(marker+' fresh');await cloud(key,marker+' fresh');results.editClearReload=true;save();
 await a.page.goto('/auth');await a.page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).click();await a.page.getByLabel('Email address',{exact:true}).waitFor();await a.context.close();
 const b=await login(),fresh=await open(b.page);assert.equal(await fresh.inputValue(),marker+' fresh');results.freshPasswordLogin=true;verificationSession=await session('learner');
 const educator=await session('facilitator');assert.equal((await read(key,educator))[0]?.response,marker+' fresh');results.authorisedEducatorCanReviewSavedEvidence=true;
 for(const role of ['other','unassigned']){assert.equal((await read(key,await session(role))).length,0);results[role==='other'?'otherAccountDenied':'revokedEducatorDenied']=true;}
 await fresh.fill(original);await cloud(key,original);results.originalSyntheticValueRestored=true;assert.equal(await b.page.getByRole('button',{name:'Teacher View',exact:true}).count(),0);results.learnerTeacherGuidanceDenied=true;await b.context.close();assert.equal(results.pageErrors.length,0);save();console.log(JSON.stringify({lessonId:unit.id,editClearReload:true,freshLogin:true,educatorReview:true,otherAndRevokedDenied:true,originalRestored:true,commit:results.commit}));
}catch(error){results.failure=error.message;save();throw error;}finally{await browser.close();}
