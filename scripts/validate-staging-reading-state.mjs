// Genuine persistence for existing reading-only lessons. Optional notes and
// completion remain distinct from authored learner-response controls.
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
const ids=(process.env.AC_READING_LESSONS??'g10-t4-l78-074,g10-t4-l79-075,g10-t4-l80-076').split(',');
assert.equal(new Set(ids).size,ids.length);
const all=await runtimeUnits(),units=ids.map(id=>{const unit=all.find(u=>u.id===id);assert.ok(unit?.type==='lesson');return unit;});
const learner=fixtures.users.learner,storage='applied-commerce-learning-state-v1:user:'+learner.id;
const results={at:new Date().toISOString(),projectRef:config.projectRef,authentication:'genuine staging password login',syntheticOnly:true,newResponseFields:0,lessons:[],pageErrors:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(results,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
let token,releaseId,failed;const snapshots=new Map(),touched=new Set();
async function session(role='learner'){const c=fixtures.users[role],r=await fetch(config.url+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:c.email,password:c.password})});assert.equal(r.status,200);return r.json();}
async function api(path,auth=token,body){const r=await fetch(config.url+path,{method:body===undefined?'GET':'POST',headers:{apikey:config.key,Authorization:'Bearer '+auth.access_token,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});assert.equal(r.status,200);return r.json();}
async function state(id,auth=token){
 const filter='&learner_id=eq.'+learner.id+'&curriculum_release_id=eq.'+releaseId+'&unit_id=eq.'+id;
 const [notes,progress]=await Promise.all([api('/rest/v1/lesson_notes?select=note,sync_revision'+filter,auth),api('/rest/v1/lesson_progress?select=status,sync_revision'+filter,auth)]);
 assert.ok(notes.length<=1&&progress.length<=1);return {note:notes[0]?.note??'',complete:progress[0]?.status==='completed',noteRevision:notes[0]?.sync_revision??0,completionRevision:progress[0]?.sync_revision??0,noteRows:notes.length,progressRows:progress.length};
}
async function cloud(id,note,complete){for(let i=0;i<40;i++){const s=await state(id);if(s.note===note&&s.complete===complete)return;await new Promise(r=>setTimeout(r,500));}throw Error('Expected synthetic reading state not persisted');}
async function login(){const context=await browser.newContext({baseURL}),page=await context.newPage();page.on('pageerror',e=>results.pageErrors.push(e.name));await page.goto(access.shareableUrl);const r=await page.request.get('/api/health');assert.equal(new URL(r.url()).origin,baseURL);assert.match(r.headers()['content-type']??'',/application\/json/);const h=await r.json();assert.equal(h.projectRef,config.projectRef);assert.equal(h.commit,process.env.AC_EXPECTED_COMMIT);results.commit=h.commit;await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(learner.email);await page.getByLabel('Password',{exact:true}).fill(learner.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});token=await session();return {context,page};}
async function open(page,u){await page.goto(`/learn/${u.grade}/term/${u.term}/${u.id}`);await page.getByRole('heading',{level:1,name:u.title,exact:true}).waitFor();await page.waitForFunction(storage=>JSON.parse(localStorage.getItem(storage)||'{}').sync?.baseline!==undefined,storage,{timeout:30000});assert.equal(await page.locator('.lesson-document').locator('input,textarea,select').count(),0,'Reading-only source unexpectedly gained a response field');assert.equal(await page.getByLabel('Lesson notes',{exact:true}).count(),1);}
async function complete(page,value){const button=page.getByRole('button',{name:value?'Mark lesson complete':'Completed',exact:true});if(await button.count())await button.click();}
try{
 token=await session();const releases=await api('/rest/v1/curriculum_releases?select=id&release_key=eq.ac-runtime-3');assert.equal(releases.length,1);releaseId=releases[0].id;for(const u of units)snapshots.set(u.id,await state(u.id));
 const a=await login();
 for(const u of units){await open(a.page,u);const original=snapshots.get(u.id),note=a.page.getByLabel('Lesson notes',{exact:true}),marker='Synthetic reading-only note '+u.id+' '+Date.now();touched.add(u.id);await note.fill(marker);await complete(a.page,true);await cloud(u.id,marker,true);await note.fill(marker+' edited');await cloud(u.id,marker+' edited',true);await a.page.reload();await open(a.page,u);assert.equal(await note.inputValue(),marker+' edited');await note.fill('');await complete(a.page,false);await cloud(u.id,'',false);await a.page.reload();await open(a.page,u);assert.equal(await note.inputValue(),'');assert.equal(await a.page.getByRole('button',{name:'Mark lesson complete',exact:true}).count(),1);await note.fill(marker+' fresh');await complete(a.page,true);await cloud(u.id,marker+' fresh',true);results.lessons.push({lessonId:u.id,authoredResponseControls:0,existingOptionalNotes:true,noteEditClearReload:true,completionToggleReload:true,originalComplete:original.complete});save();}
 await a.page.goto('/auth');await a.page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).click();await a.page.getByLabel('Email address',{exact:true}).waitFor();assert.equal((await a.page.request.get('/api/classroom')).status(),401);await a.context.close();
 const b=await login();for(const u of units){await open(b.page,u);assert.match(await b.page.getByLabel('Lesson notes',{exact:true}).inputValue(),new RegExp('^Synthetic reading-only note '+u.id+' .* fresh$'));assert.equal(await b.page.getByRole('button',{name:'Completed',exact:true}).count(),1);assert.equal(await b.page.getByRole('button',{name:'Teacher View',exact:true}).count(),0);results.lessons.find(r=>r.lessonId===u.id).freshPasswordLogin=true;}
 const educator=await session('facilitator');for(const u of units){const s=await state(u.id,educator);assert.ok(s.note.endsWith(' fresh')&&s.complete);results.lessons.find(r=>r.lessonId===u.id).assignedEducatorCanRead=true;}
 for(const role of ['other','unassigned']){const auth=await session(role);for(const u of units){const s=await state(u.id,auth);assert.equal(s.noteRows+s.progressRows,0);}}
 results.otherAndRevokedDenied=true;await b.context.close();assert.equal(results.pageErrors.length,0);results.status='PASS';
}catch(error){failed=error;results.status='FAIL';results.failure=error.message;}
finally{
 await browser.close();
 if(touched.size)try{token=await session();for(const id of touched){const current=await state(id),old=snapshots.get(id);const r=await api('/rest/v1/rpc/save_learning_changes_for_account',token,{p_account_id:learner.id,p_changes:[{kind:'note',key:id,value:old.note,expected:current.noteRevision},{kind:'completion',key:id,value:old.complete,expected:current.completionRevision}]});assert.ok(r.length===2&&r.every(x=>!x.conflict));await cloud(id,old.note,old.complete);}results.originalSyntheticValuesRestored=true;}catch(e){failed??=e;results.status='FAIL';results.originalSyntheticValuesRestored=false;}
 save();
}
if(failed)throw failed;
console.log(JSON.stringify({readingOnlyPersistence:results.status,lessons:results.lessons.length,authoredResponseControls:0,existingNotesAndCompletion:true,freshLogin:true,scopedReview:true,originalValuesRestored:results.originalSyntheticValuesRestored,commit:results.commit}));
