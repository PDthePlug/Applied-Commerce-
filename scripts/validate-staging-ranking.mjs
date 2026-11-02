// Genuine password sessions and the existing native ranking. RPC fixture
// preparation/clearing is reported separately from browser interaction.
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
const unit=(await runtimeUnits()).find(u=>u.id===(process.env.AC_RANKING_LESSON_ID??'g10-t3-l46-046'));
assert.ok(unit?.type==='lesson');
const block=process.env.AC_RANKING_BLOCK_ID?unit.blocks.find(b=>b.id===process.env.AC_RANKING_BLOCK_ID):unit.blocks[24];
const index=unit.blocks.indexOf(block),instruction=unit.blocks[index-1];
const inlineInstruction=/^Rank\b/.test(block?.text??'');
assert.ok(block?.text.includes('☐')&&(inlineInstruction||/^Rank\b/.test(instruction?.text??'')));
const options=block.text.split('☐').slice(1).map(s=>s.trim()).filter(Boolean);
assert.ok(options.length>1);
const credentials=fixtures.users.learner,key=`${unit.id}::prompt-${block.id}::choice`,legacyKey=inlineInstruction?null:`${unit.id}::prompt-${instruction.id}::response`;
const storage='applied-commerce-learning-state-v1:user:'+credentials.id;
const results={at:new Date().toISOString(),projectRef:config.projectRef,lessonId:unit.id,blockId:block.id,responseKey:key,legacyResponseKey:legacyKey,instructionLayout:inlineInstruction?'inline with choices':'separate preceding instruction',authentication:'genuine staging password login',options:options.length,syntheticEvidenceOnly:true,pageErrors:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(results,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
let verificationSession,original,legacyOriginal,changed=false;
async function session(role){const c=fixtures.users[role],r=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:c.email,password:c.password})});assert.equal(r.status,200);return r.json();}
async function api(path,token=verificationSession,body){const r=await fetch(config.url+path,{method:body===undefined?'GET':'POST',headers:{apikey:config.key,Authorization:'Bearer '+token.access_token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});assert.equal(r.status,200);return r.json();}
const rows=(responseKey,token)=>api('/rest/v1/prompt_responses?select=response,sync_revision&learner_id=eq.'+credentials.id+'&prompt_key=eq.'+encodeURIComponent(responseKey),token);
async function write(responseKey,value){const current=await rows(responseKey),reply=await api('/rest/v1/rpc/save_learning_changes_for_account',verificationSession,{p_account_id:credentials.id,p_changes:[{kind:'prompt',key:responseKey,value,expected:current[0]?.sync_revision??0}]});assert.ok(reply.length&&reply.every(r=>!r.conflict));}
async function cloud(value){for(let i=0;i<40;i++){if((await rows(key))[0]?.response===value)return;await new Promise(r=>setTimeout(r,500));}throw Error('Expected synthetic ranking cloud value absent');}
async function login(){const context=await browser.newContext({baseURL}),page=await context.newPage();page.on('pageerror',e=>results.pageErrors.push(e.name));await page.goto(access.shareableUrl);const r=await page.request.get('/api/health');assert.equal(new URL(r.url()).origin,baseURL);assert.match(r.headers()['content-type']??'',/application\/json/);const health=await r.json();assert.equal(health.projectRef,config.projectRef);assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);results.commit=health.commit;await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(credentials.email);await page.getByLabel('Password',{exact:true}).fill(credentials.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});return {context,page};}
async function open(page){await page.goto(`/learn/${unit.grade}/term/${unit.term}/${unit.id}`);await page.waitForFunction(storage=>JSON.parse(localStorage.getItem(storage)||'{}').sync?.baseline!==undefined,storage,{timeout:30000});const control=page.locator('.ranking-control');await control.waitFor();assert.equal(await control.count(),1);assert.equal(await control.locator('li').count(),options.length);return control;}
const order=control=>control.locator('li strong').allTextContents();
const renderedValue=(page,value)=>page.waitForFunction(({storage,key,value})=>(JSON.parse(localStorage.getItem(storage)||'{}').promptResponses?.[key]??'')===value,{storage,key,value},{timeout:30000});
async function retained(page,marker){const group=page.locator('.ranking-instruction');if(inlineInstruction){assert.equal(await group.count(),0,'Inline ranking must not invent a separate instruction response');return;}assert.equal(await group.count(),1);await group.getByText('Previous combined response',{exact:true}).click();assert.equal(await group.getByText(marker,{exact:true}).count(),1);}
try{
 verificationSession=await session('learner');original=(await rows(key))[0]?.response??'';if(legacyKey)legacyOriginal=(await rows(legacyKey))[0]?.response??'';
 const marker='Synthetic retained ranking instruction '+Date.now();changed=true;if(legacyKey){await write(legacyKey,marker);results.legacyPreparation='ordinary authenticated learner revision-checked RPC';}else results.legacyPreparation='NOT APPLICABLE: inline instruction has no separate previous response slot';
 const a=await login(),control=await open(a.page);await retained(a.page,marker);const initial=await order(control);assert.deepEqual([...initial].sort(),[...options].sort());
 const first=[...initial];[first[0],first[1]]=[first[1],first[0]];await control.getByRole('button',{name:'Move '+initial[0]+' down',exact:true}).click();await control.getByRole('button',{name:'Save this order',exact:true}).click();await cloud(first.join('\n'));
 const second=[...first],last=second.length-1;[second[last-1],second[last]]=[second[last],second[last-1]];await control.getByRole('button',{name:'Move '+first[last]+' up',exact:true}).click();await cloud(second.join('\n'));await a.page.reload();assert.deepEqual(await order(await open(a.page)),second);results.browserReorderEditAndReload=true;
 await a.page.goto('/auth');await a.page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).click();await a.page.getByLabel('Email address',{exact:true}).waitFor();await a.context.close();
 const b=await login();verificationSession=await session('learner');assert.deepEqual(await order(await open(b.page)),second);await retained(b.page,marker);results.freshPasswordLogin=true;results.previousWrittenInstructionRecoverable=inlineInstruction?'NOT APPLICABLE: no separate instruction slot':true;
 assert.equal((await rows(key,await session('facilitator')))[0]?.response,second.join('\n'));results.authorisedEducatorCanReviewSavedEvidence=true;
 for(const role of['other','unassigned']){assert.equal((await rows(key,await session(role))).length,0);results[role==='other'?'otherAccountDenied':'revokedEducatorDenied']=true;}
 assert.equal(await b.page.getByRole('button',{name:'Teacher View',exact:true}).count(),0);results.learnerTeacherGuidanceDenied=true;
 await write(key,'');await cloud('');const cleared=await open(b.page);await renderedValue(b.page,'');await cleared.getByText('Order not yet confirmed',{exact:true}).waitFor();assert.deepEqual(await order(cleared),options);results.clearViaSupportedLearnerRpc='PASS; no browser clear-all control exists or is claimed';
 await write(key,original);if(legacyKey)await write(legacyKey,legacyOriginal);await cloud(original);if(legacyKey)assert.equal((await rows(legacyKey))[0]?.response,legacyOriginal);await open(b.page);await renderedValue(b.page,original);changed=false;results.originalSyntheticValuesRestored=true;await b.context.close();assert.equal(results.pageErrors.length,0);save();console.log(JSON.stringify({lessonId:unit.id,browserReorderEditAndReload:true,freshPasswordLogin:true,previousWrittenInstructionRecoverable:results.previousWrittenInstructionRecoverable,scopedReview:true,rpcClearOnly:true,originalRestored:true,commit:results.commit}));
}catch(error){results.failure=error.message;save();throw error;}finally{
 await browser.close();
 if(changed&&original!==undefined&&(inlineInstruction||legacyOriginal!==undefined)){try{verificationSession=await session('learner');await write(key,original);if(legacyKey)await write(legacyKey,legacyOriginal);results.failureCleanupRestoredOriginals=true;}catch{results.failureCleanupRestoredOriginals=false;}save();}
}
