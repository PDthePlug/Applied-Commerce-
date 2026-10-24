// Genuine staging validation: real password logins, real classroom API, real
// learner RPC saves. All authenticated screenshots remain in AC_ROLE_FIXTURES.
import fs from 'node:fs';
import {stagingLessonScope} from './lib/staging-lesson-scope.mjs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {loadRoleFixtures} from './lib/validation-target.mjs';
import {runtimeUnits} from './semantic-census.mjs';
process.umask(0o077);
const dir=process.env.AC_ROLE_FIXTURES,{config,fixtures}=loadRoleFixtures(dir);
assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const baseURL=process.env.AC_ROLE_BASE_URL;assert.ok(baseURL&&new URL(baseURL).hostname.startsWith('applied-commerce-sa-staging'));
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE)).content[0].text);
const out=process.env.AC_STAGING_EVIDENCE_DIR??dir+'/rollout';fs.mkdirSync(out,{recursive:true,mode:0o700});
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY,bypass:'localhost,127.0.0.1'}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const results={at:new Date().toISOString(),projectRef:config.projectRef,baseURL,authentication:'genuine staging password login',plans:[],responsive:[],persistence:[],errors:[]};
const save=()=>fs.writeFileSync(out+'/shared-results.json',JSON.stringify(results,null,2));
async function login(role){
 const context=await browser.newContext({baseURL,viewport:{width:1280,height:900}}),page=await context.newPage();
 page.on('pageerror',error=>results.errors.push(error.message));
 await page.goto(access.shareableUrl);const health=await(await page.request.get('/api/health')).json();assert.equal(health.projectRef,config.projectRef);assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);results.commit=health.commit;
 await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(fixtures.users[role].email);await page.getByLabel('Password',{exact:true}).fill(fixtures.users[role].password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});return {context,page};
}
const manifest=JSON.parse(fs.readFileSync('content/instructional/teaching-manifest.v2.json'));
const route=b=>`/learn/${b.grade}/term/${b.term}/${b.lessonId}`;
async function teacher(page,b){await page.goto(route(b));await page.getByRole('button',{name:'Teacher View',exact:true}).click();await page.locator('[data-instructional-location="preparation"]').waitFor();}
const overflow=page=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
try{
 const a=await login('facilitator');
 const selection=stagingLessonScope(manifest.plans,process.env.AC_STAGING_NAV_LESSONS);Object.assign(results,{navigationScope:selection.scope,releasedPlans:selection.releasedPlans});
 for(const binding of selection.plans){
  const {page}=a;await teacher(page,binding);assert.equal(await page.locator('.contextual-guidance nav').count(),0);assert.equal(await page.getByRole('button',{name:'Teaching navigator',exact:true}).count(),0);assert.equal(await page.getByRole('navigation',{name:'Classroom teaching stages',exact:true}).count(),1);
  const options=await page.locator('#classroom-stage option').evaluateAll(nodes=>nodes.map(n=>n.value));assert.deepEqual([...options].sort(),binding.moments.map(m=>m.id).sort());
  // Navigate every target, including backward revisits and support/later work.
  for(const moment of binding.moments){
   await page.evaluate(()=>document.querySelectorAll('.contextual-guidance,.deepening-insight').forEach(n=>n.open=false));
   await page.locator('#classroom-stage').selectOption(moment.id);await page.getByRole('button',{name:'Go to stage',exact:true}).click();
   assert.equal(await page.evaluate(()=>document.activeElement?.id),'teacher-moment-'+moment.id);
   const target=page.locator('[data-instructional-location="'+moment.id+'"]');assert.equal(await target.getAttribute('open'),'');
   assert.equal(await target.getAttribute('data-source-placement'),moment.placement.blockId);
   assert.equal(await target.evaluate(node=>{for(let p=node.parentElement;p;p=p.parentElement)if(p instanceof HTMLDetailsElement&&!p.open)return false;return true;}),true);
   if(moment.schedule==='classroom')assert.ok((await target.locator('[data-facilitation-cue]').innerText()).trim());
  }
  await page.getByRole('button',{name:'Learner View',exact:true}).click();assert.equal(await page.locator('.contextual-guidance').count(),0);
  results.plans.push({lessonId:binding.lessonId,targets:options.length,noRepeatedNavigation:true,sourcePlacement:true,learnerView:true});save();
 }
 for(const lessonId of (process.env.AC_STAGING_LESSONS?.split(',')??['g8-t1-l01-001','g8-t1-l08-008','g8-t1-l10-010','g12-t1-l05-005']))for(const width of [320,360,430,768,1280,1920]){
  const binding=manifest.plans.find(b=>b.lessonId===lessonId);assert.ok(binding,lessonId);const {page}=a;await page.setViewportSize({width,height:900});await teacher(page,binding);
  const prep=page.locator('[data-instructional-location="preparation"]');assert.equal(await prep.getAttribute('open'),null);
  const first=binding.moments.find(m=>m.schedule==='classroom');await page.locator('#classroom-stage').selectOption(first.id);await page.getByRole('button',{name:'Go to stage',exact:true}).click();
  const stage=page.locator('[data-instructional-location="'+first.id+'"]');const depth=stage.locator('.contextual-depth');if(await depth.count()){assert.equal(await depth.getAttribute('open'),null);await depth.locator(':scope > summary').click();await depth.locator('p').first().waitFor();await depth.locator(':scope > summary').click();}
  for(const scale of [1,1.28,2]){
   await page.evaluate(s=>document.documentElement.style.setProperty('--ac-text-scale',String(s)),scale);assert.equal(await overflow(page),false);await stage.scrollIntoViewIfNeeded();
   if([320,430,1280].includes(width))await page.screenshot({path:out+`/teacher-after-${lessonId}-${width}-${scale}.png`});
   const checkpoints=page.locator('.learning-section.learning-mode-prove').filter({has:page.locator('.checkpoint-question')});
   for(const checkpoint of await checkpoints.all()){
    const labels=await checkpoint.locator('.structured-part-label').allTextContents();assert.deepEqual(labels,labels.map((_,i)=>`${i+1}.`));
    for(const question of await checkpoint.locator('.checkpoint-question').all()){
     const layout=await question.evaluate(node=>{const n=node.querySelector('.structured-part-label'),p=node.querySelector('.question-prompt'),a=n.getBoundingClientRect(),b=p.getBoundingClientRect();return {numberRight:a.right,textLeft:b.x,font:parseFloat(getComputedStyle(p).fontSize),numberFont:parseFloat(getComputedStyle(n).fontSize)};});assert.ok(layout.textLeft>layout.numberRight&&layout.font>=16&&layout.numberFont>=16);
    }
   }
   const question=page.locator('.checkpoint-question').first();if(await question.count()){await question.scrollIntoViewIfNeeded();if([320,430,1280].includes(width))await page.screenshot({path:out+`/checkpoint-after-${lessonId}-${width}-${scale}.png`});}
   results.responsive.push({lessonId,width,scale,overflow:false,numbersContinuous:true,localDepth:await depth.count()?'expanded and collapsed':'absent; exact expected presence checked by classroom runner'});save();
  }
 }
 await a.context.close();
 // Use the learner's supported revision-checked RPC to retain an actual prior
 // combined answer alongside both current split responses. No local auth/state.
 const credentials=fixtures.users.learner;
 const auth=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:credentials.email,password:credentials.password})});assert.equal(auth.status,200);const session=await auth.json();
 async function api(path,method='GET',body){const r=await fetch(config.url+path,{method,headers:{apikey:config.key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});assert.equal(r.status,200);return r.json();}
 const unit=(await runtimeUnits()).find(u=>u.id==='g8-t1-l08-008');const key=slot=>`${unit.id}::prompt-${unit.blocks[40].id}::${slot}`;
 const marker='Synthetic split checkpoint '+Date.now(),expected=new Map();
 const rows=await api('/rest/v1/prompt_responses?select=prompt_key,sync_revision&learner_id=eq.'+credentials.id);for(const row of rows)expected.set(row.prompt_key,row.sync_revision);
 const changes=[['response',marker+' previous combined'],['response-0',marker+' short'],['response-1',marker+' longer explanation']].map(([slot,value])=>({kind:'prompt',key:key(slot),value,expected:expected.get(key(slot))??0}));
 const written=await api('/rest/v1/rpc/save_learning_changes_for_account','POST',{p_account_id:credentials.id,p_changes:changes});assert.ok(written.every(x=>!x.conflict));
 const baseline=page=>page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'{}').sync?.baseline!==undefined,'applied-commerce-learning-state-v1:user:'+credentials.id,{timeout:30000});
 const b=await login('learner');await b.page.goto(route(manifest.plans.find(x=>x.lessonId===unit.id)));await baseline(b.page);
 const checkpoint=b.page.locator('.learning-section.learning-mode-prove').first();const short=checkpoint.getByRole('textbox',{name:'Choose one item from your list.',exact:true});assert.equal(await short.inputValue(),marker+' short');await checkpoint.getByText('Previous combined response',{exact:true}).click();assert.equal(await checkpoint.getByText(marker+' previous combined',{exact:true}).count(),1);
 await short.fill(marker+' edited');await waitCloud(key('response-0'),marker+' edited');await b.page.reload();await baseline(b.page);assert.equal(await short.inputValue(),marker+' edited');await short.fill('');await waitCloud(key('response-0'),'');await b.page.reload();await baseline(b.page);assert.equal(await short.inputValue(),'');
 const newLessonEvidence=[];
 for(const lessonId of (process.env.AC_PERSIST_LESSONS?.split(',').filter(Boolean)??[])){
  const binding=manifest.plans.find(row=>row.lessonId===lessonId);assert.ok(binding);await b.page.goto(route(binding));await baseline(b.page);const input=b.page.locator('.lesson-document').getByRole('textbox').first();await input.waitFor();
  const value='Synthetic new-lesson evidence '+lessonId+' '+Date.now();await input.fill(value+' initial');const handle=await b.page.waitForFunction(({storage,value})=>Object.entries(JSON.parse(localStorage.getItem(storage)||'{}').promptResponses??{}).find(([,text])=>text===value)?.[0],{storage:'applied-commerce-learning-state-v1:user:'+credentials.id,value:value+' initial'});const responseKey=await handle.jsonValue();assert.ok(responseKey.startsWith(lessonId+'::'));await waitCloud(responseKey,value+' initial');
  await input.fill(value+' edited');await waitCloud(responseKey,value+' edited');await b.page.reload();await baseline(b.page);assert.equal(await input.inputValue(),value+' edited');await input.fill('');await waitCloud(responseKey,'');await b.page.reload();await baseline(b.page);assert.equal(await input.inputValue(),'');await input.fill(value+' final');await waitCloud(responseKey,value+' final');newLessonEvidence.push({lessonId,responseKey,value:value+' final'});
 }
 await b.page.goto('/auth');await b.page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).click();await b.page.getByLabel('Email address',{exact:true}).waitFor({timeout:60000});assert.equal((await b.page.request.get('/api/classroom')).status(),401);await b.context.close();
 const c=await login('learner');await c.page.goto(route(manifest.plans.find(x=>x.lessonId===unit.id)));await baseline(c.page);const fresh=c.page.locator('.learning-section.learning-mode-prove').first();assert.equal(await fresh.getByRole('textbox',{name:'Choose one item from your list.',exact:true}).inputValue(),'');await fresh.getByText('Previous combined response',{exact:true}).click();assert.equal(await fresh.getByText(marker+' previous combined',{exact:true}).count(),1);assert.equal(await fresh.getByRole('textbox').nth(1).inputValue(),marker+' longer explanation');assert.equal(await c.page.getByRole('button',{name:'Teacher View',exact:true}).count(),0);for(const row of newLessonEvidence){await c.page.goto(route(manifest.plans.find(binding=>binding.lessonId===row.lessonId)));await baseline(c.page);assert.equal(await c.page.locator('.lesson-document').getByRole('textbox').first().inputValue(),row.value);}results.newLessonPersistence=newLessonEvidence.map(({lessonId,responseKey})=>({lessonId,responseKey,editClearReloadAndFreshLogin:true}));await c.context.close();
 results.persistence=['supported learner RPC saves actual stable combined and split keys','genuine browser edit, clear and reload','logout and fresh password login retains cleared short answer, combined answer and longer response','learner denied teacher view'];assert.equal(results.errors.length,0);save();console.log(JSON.stringify({commit:results.commit,plans:results.plans.length,responsive:results.responsive.length,persistence:results.persistence,errors:results.errors}));
 async function waitCloud(promptKey,value){for(let i=0;i<40;i++){const rows=await api('/rest/v1/prompt_responses?select=response&learner_id=eq.'+credentials.id+'&prompt_key=eq.'+encodeURIComponent(promptKey));if(rows[0]?.response===value)return;await new Promise(r=>setTimeout(r,500));}throw Error('Cloud save did not persist expected synthetic response');}
}catch(error){results.failure=error.message;save();throw error;}finally{await browser.close();}
