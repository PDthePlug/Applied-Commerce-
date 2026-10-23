// Genuine hosted validation. No mocked auth, role or API response. Print-dialog
// suppression is only to inspect the application's real private print tree.
import fs from 'node:fs';
import {stagingLessonScope} from './lib/staging-lesson-scope.mjs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {loadRoleFixtures} from './lib/validation-target.mjs';
process.umask(0o077);
const dir=process.env.AC_ROLE_FIXTURES,{config,fixtures}=loadRoleFixtures(dir);
assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const baseURL=process.env.AC_ROLE_BASE_URL;
assert.ok(baseURL&&new URL(baseURL).hostname.startsWith('applied-commerce-sa-staging'));
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE??dir+'/final-access.json')).content[0].text);
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY,bypass:'localhost,127.0.0.1'}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const evidence=process.env.AC_STAGING_EVIDENCE_DIR??dir+'/final-evidence';
const resultFile=process.env.AC_STAGING_RESULTS_FILE??dir+'/final-browser-results.json';fs.mkdirSync(evidence,{recursive:true,mode:0o700});
const result=process.env.AC_STAGING_RESUME==='1'?JSON.parse(fs.readFileSync(resultFile)):{at:new Date().toISOString(),baseURL,projectRef:config.projectRef,authentication:'real browser password login',plans:[],roles:[],persistence:[],delivery:[]};
assert.equal(result.baseURL,baseURL);assert.equal(result.projectRef,config.projectRef);delete result.failure;
const save=()=>fs.writeFileSync(resultFile,JSON.stringify(result,null,2));
async function login(role,viewport={width:1280,height:900}){
 const context=await browser.newContext({baseURL,viewport});const page=await context.newPage();
 await page.goto(access.shareableUrl);const health=await(await page.request.get('/api/health')).json();assert.equal(health.projectRef,config.projectRef);result.commit=health.commit;
 if(process.env.AC_EXPECTED_COMMIT)assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);
 await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(fixtures.users[role].email);await page.getByLabel('Password',{exact:true}).fill(fixtures.users[role].password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});
 return {context,page};
}
const httpSessions={};
async function api(role,path,method='GET',body){
 if(!httpSessions[role]){const credentials=fixtures.users[role];const auth=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:credentials.email,password:credentials.password})});assert.equal(auth.status,200);httpSessions[role]=await auth.json();}
 const session=httpSessions[role];
 const response=await fetch(config.url+path,{method,headers:{apikey:config.key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,data:await response.json().catch(()=>null)};
}
try{
 const {page,context}=await login('facilitator');
 const manifest=JSON.parse(fs.readFileSync('content/instructional/teaching-manifest.v2.json'));
 const cdp=await context.newCDPSession(page);await cdp.send('Performance.enable');
 const selection=stagingLessonScope(manifest.plans,process.env.AC_STAGING_LESSONS);Object.assign(result,{scope:selection.scope,releasedPlans:selection.releasedPlans});
 for(const binding of selection.plans){
  if(result.plans.some(p=>p.lessonId===binding.lessonId))continue;
  const route=`/learn/${binding.grade}/term/${binding.term}/${binding.lessonId}`;
  const before=(await cdp.send('Performance.getMetrics')).metrics.find(m=>m.name==='JSHeapUsedSize')?.value;
  const response=await page.request.get('/api/classroom?lesson='+binding.lessonId+'&catalog=omit');assert.equal(response.status(),200);const payload=await response.json();
  await page.goto(route);await page.locator('.lesson-document').waitFor();const responseControls=()=>page.locator('.lesson-document input,.lesson-document textarea,.lesson-document select').evaluateAll(nodes=>nodes.filter(node=>!node.closest('.contextual-private')).map(node=>({tag:node.tagName,type:node.getAttribute('type'),label:node.getAttribute('aria-label'),id:node.getAttribute('id')})));const learnerControls=await responseControls();await page.getByRole('button',{name:'Teacher View',exact:true}).click();await page.locator('[data-instructional-location="preparation"]').waitFor();
  assert.deepEqual(await responseControls(),learnerControls,'Teacher mode changed original response controls: '+binding.lessonId);
  const originals=await page.locator('[data-instructional-field]').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.getAttribute('data-instructional-field'),n.textContent])));
  for(const [field,value]of Object.entries(payload.plan.fields))assert.equal(originals[field],value,binding.lessonId+' '+field);
  assert.equal(await page.locator('[data-facilitation-cue]').count(),payload.plan.moments.filter(m=>m.schedule==='classroom').length);
  // Inspect every local disclosure and every teaching-stage navigation target.
  for(const moment of payload.plan.moments){const target=page.locator('[data-instructional-location="'+moment.id+'"]');assert.equal(await target.count(),1);const explicit=moment.core.find(group=>group.heading==='Facilitation cue');if(explicit){assert.equal(await target.locator('[data-facilitation-cue]').getAttribute('data-instructional-field'),explicit.fields[0]);const expectedDepth=[...moment.core.filter(group=>group!==explicit),...moment.depth].length?1:0;assert.equal(await target.locator('.contextual-depth').count(),expectedDepth,'Redundant or missing deeper panel: '+moment.id);}}
  await page.evaluate(()=>{window.print=()=>{window.__acPrintRequested=true;};});
  await page.locator('.contextual-tools > summary').click();await page.getByRole('button',{name:'Print complete teacher preparation',exact:true}).click();await page.locator('.contextual-print-guide').waitFor({state:'attached'});
  const printFields=await page.locator('.contextual-print-guide [data-instructional-field]').evaluateAll(nodes=>Object.fromEntries(nodes.map(n=>[n.getAttribute('data-instructional-field'),n.textContent])));
  for(const [field,value]of Object.entries(payload.plan.fields)){
   if(payload.plan.moments.some(m=>m.title===field))assert.ok(printFields[field]?.includes(value),'print title '+binding.lessonId+' '+field);
   else assert.equal(printFields[field],value,'print '+binding.lessonId+' '+field);
  }
  await page.pdf({path:evidence+'/'+binding.lessonId+'.pdf',format:'A4',printBackground:true});await page.evaluate(()=>window.dispatchEvent(new Event('afterprint')));
  const after=(await cdp.send('Performance.getMetrics')).metrics.find(m=>m.name==='JSHeapUsedSize')?.value;
  result.plans.push({lessonId:binding.lessonId,fields:Object.keys(originals).length,originalFieldsPreserved:true,originalResponseControlsPreserved:true,noRedundantDepthPanels:true,printFieldsPreserved:true,heapBefore:before,heapAfter:after});save();
 }
 for(const catalog of ['include','omit'])for(let i=0;i<5;i++){
  const started=performance.now(),r=await page.request.get('/api/classroom?lesson=g8-t1-l01-001'+(catalog==='omit'?'&catalog=omit':'')),body=await r.body();assert.equal(r.status(),200);
  result.delivery.push({catalog,request:i+1,ms:Math.round(performance.now()-started),decodedBytes:body.length,cache:r.headers()['cache-control']});save();
 }
 // Real role change while this educator browser remains signed in.
 const revoked=await api('schoolAdmin','/rest/v1/cohort_staff?cohort_id=eq.'+fixtures.cohortId+'&user_id=eq.'+fixtures.users.facilitator.id,'PATCH',{status:'disabled'});assert.equal(revoked.status,200);
 try{const r=await page.request.get('/api/classroom?lesson=g8-t1-l01-001');assert.equal(r.status(),403);result.roles.push({role:'facilitator existing session after revocation',status:r.status()});
  await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await page.getByRole('button',{name:'Teacher View',exact:true}).waitFor({state:'hidden'});assert.equal(await page.locator('.contextual-guidance').count(),0);
 }finally{await api('schoolAdmin','/rest/v1/rpc/add_cohort_staff_by_email','POST',{p_cohort_id:fixtures.cohortId,p_email:fixtures.users.facilitator.email,p_role:'educator'});}
 await context.close();save();
 // Make the inactive fixture genuinely revoked, retaining its educator membership.
 await api('schoolAdmin','/rest/v1/rpc/add_cohort_staff_by_email','POST',{p_cohort_id:fixtures.cohortId,p_email:fixtures.users.unassigned.email,p_role:'educator'});
 await api('schoolAdmin','/rest/v1/cohort_staff?cohort_id=eq.'+fixtures.cohortId+'&user_id=eq.'+fixtures.users.unassigned.id,'PATCH',{status:'disabled'});
 for(const [role,status]of [['platformAdmin',200],['schoolAdmin',200],['learner',403],['unassigned',403],['other',403]]){
  const a=await login(role);const r=await a.page.request.get('/api/classroom?lesson=g8-t1-l01-001');assert.equal(r.status(),status);result.roles.push({role,status});await a.context.close();save();
 }
 // Browser saves original answer, reflection, notes and completion; fresh login
 // must recover cloud state without copying application storage or auth cookies.
 const a=await login('learner'),lesson='/learn/8/term/1/g8-t1-l01-001';await a.page.goto(lesson);
 const baseline=page=>page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||'{}').sync?.baseline!==undefined,'applied-commerce-learning-state-v1:user:'+fixtures.users.learner.id,{timeout:30000});
 await baseline(a.page);
 const marker='Synthetic classroom evidence '+Date.now(),reflection=marker+' reflection';
 await a.page.locator('.lesson-document textarea').first().fill(marker);await a.page.locator('.lesson-document textarea').nth(1).fill(reflection);await a.page.getByLabel('Lesson notes',{exact:true}).fill(marker+' note');
 const button=a.page.getByRole('button',{name:'Mark lesson complete',exact:true});if(await button.count())await button.click();
 for(let i=0;i<20;i++){const rows=await api('learner','/rest/v1/prompt_responses?select=response&learner_id=eq.'+fixtures.users.learner.id);if(rows.data.some(row=>row.response===marker)&&rows.data.some(row=>row.response===reflection))break;if(i===19)throw Error('Cloud response persistence timed out');await new Promise(resolve=>setTimeout(resolve,500));}
 await a.page.reload();await baseline(a.page);assert.equal(await a.page.locator('.lesson-document textarea').first().inputValue(),marker);result.persistence.push('browser save and reload');
 await a.page.goto('/portfolio');await a.page.waitForFunction(value=>document.querySelector('main')?.textContent?.includes(value),marker,{timeout:30000});result.persistence.push('portfolio contains synthetic original response');
 await a.page.goto('/auth');await a.page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).click();const afterLogout=await a.page.request.get('/api/classroom');assert.equal(afterLogout.status(),401);await a.context.close();
 const b=await login('learner');await b.page.goto(lesson);await baseline(b.page);assert.equal(await b.page.locator('.lesson-document textarea').first().inputValue(),marker);assert.equal(await b.page.locator('.lesson-document textarea').nth(1).inputValue(),reflection);assert.equal(await b.page.getByLabel('Lesson notes',{exact:true}).inputValue(),marker+' note');assert.equal(await b.page.getByRole('button',{name:'Completed',exact:true}).count(),1);result.persistence.push('fresh browser password login restores answers, reflection, note and completion');await b.context.close();save();
 console.log(JSON.stringify({plans:result.plans.length,roles:result.roles,persistence:result.persistence,delivery:result.delivery,commit:result.commit}));
}catch(error){result.failure=error.message;save();throw error;}finally{await browser.close();}
