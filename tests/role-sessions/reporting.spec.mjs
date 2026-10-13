import fs from 'node:fs';
import zlib from 'node:zlib';
import {test,expect} from '@playwright/test';
import {loadRoleFixtures,verifyHostedTarget} from '../../scripts/lib/validation-target.mjs';
const directory=process.env.AC_ROLE_FIXTURES;
const {config,fixtures}=loadRoleFixtures(directory);
const index=JSON.parse(fs.readFileSync('public/curriculum/index.json','utf8'));
const grade=index.grades.find(g=>g.grade===8);
const encoded=Array.from({length:grade.bundleParts},(_,i)=>fs.readFileSync(`public/curriculum/grade-8.part-${i+1}.b64`,'utf8').trim()).join('');
const unit=JSON.parse(zlib.gunzipSync(Buffer.from(encoded,'base64'))).terms[0].units.find(u=>u.id==='g8-t1-l01-001');
const block=unit.blocks.find(b=>b.kind==='text'&&b.type==='activity');
const key=unit.id+'::prompt-'+block.id+'::response';
const sessions={};
async function request(actor,path,method='GET',body){const r=await fetch(config.url+path,{method,signal:AbortSignal.timeout(30000),headers:{apikey:config.key,'Content-Type':'application/json',...(actor?{Authorization:'Bearer '+sessions[actor].access_token}:{}),Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json().catch(()=>null)};}
async function rpc(actor,name,body){const r=await request(actor,'/rest/v1/rpc/'+name,'POST',body);expect(r.status,`${name}: HTTP ${r.status}`).toBe(200);return r.data;}
async function login(page){await page.goto('/auth');await page.locator('.auth-form').getByLabel('Email address',{exact:true}).fill(fixtures.users.schoolAdmin.email);await page.locator('.auth-form').getByLabel('Password',{exact:true}).fill(fixtures.users.schoolAdmin.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.locator('.auth-panel')).toContainText(fixtures.users.schoolAdmin.email,{timeout:60000});}
test.beforeAll(async({baseURL})=>{await verifyHostedTarget(baseURL,config,process.env.AC_EXPECTED_COMMIT);expect(fixtures.reportingLearners?.length,'Prepare append fixtures with five dedicated reporting learners').toBe(5);});
test('real cohort metrics follow pending, revision and acceptance; switches and failed loads cannot show another cohort',async({page})=>{
 const actors={schoolAdmin:fixtures.users.schoolAdmin,facilitator:fixtures.users.facilitator,...Object.fromEntries(fixtures.reportingLearners.map((user,i)=>['report'+i,user]))};
 for(const [actor,user] of Object.entries(actors)){const r=await request(null,'/auth/v1/token?grant_type=password','POST',{email:user.email,password:user.password});expect(r.status).toBe(200);sessions[actor]=r.data;}
 if(!fixtures.reportingCohortId){
  const r=await request('schoolAdmin','/rest/v1/cohorts','POST',{school_id:fixtures.schoolId,name:fixtures.run+' Reporting five',grade:8,academic_year:2026});expect(r.status).toBe(201);fixtures.reportingCohortId=r.data[0].id;
  await rpc('schoolAdmin','add_cohort_staff_by_email',{p_cohort_id:fixtures.reportingCohortId,p_email:fixtures.users.facilitator.email,p_role:'educator'});
  for(const user of fixtures.reportingLearners)await rpc('schoolAdmin','enrol_learner_by_email',{p_cohort_id:fixtures.reportingCohortId,p_email:user.email});
  const empty=await request('schoolAdmin','/rest/v1/cohorts','POST',{school_id:fixtures.schoolId,name:fixtures.run+' Empty switch',grade:8,academic_year:2026});expect(empty.status).toBe(201);fixtures.emptyCohortId=empty.data[0].id;
  fs.writeFileSync(directory+'/fixtures.json',JSON.stringify(fixtures,null,2),{mode:0o600});
 }
 const values=[];
 async function save(i,value){const user=fixtures.reportingLearners[i];const prior=await request('report'+i,'/rest/v1/prompt_responses?select=sync_revision&prompt_key=eq.'+encodeURIComponent(key)+'&learner_id=eq.'+user.id);expect(prior.status).toBe(200);const saved=await rpc('report'+i,'save_learning_changes_for_account',{p_account_id:user.id,p_changes:[{kind:'prompt',key,value,expected:prior.data[0]?.sync_revision??0}]});expect(saved[0].conflict).toBe(false);}
 for(let i=0;i<5;i++){values[i]='Dedicated reporting answer '+Date.now()+' '+i;await save(i,values[i]);}
 async function review(status,value=values[0]){return request('facilitator','/rest/v1/rpc/save_facilitator_review','POST',{p_learner_id:fixtures.reportingLearners[0].id,p_response_key:key,p_response_value:value,p_auto_result:{},p_review:{status,criteria:{},feedback:'Dedicated reporting '+status}});}
 await login(page);await page.goto('/institutions/manage');
 const cohortButton=name=>page.locator('.institution-admin-list button').filter({hasText:name});
 const pulse=page.locator('.institution-admin-card').filter({has:page.getByRole('heading',{name:'Learning and evidence coverage',exact:true})});
 const selected=page.locator('.institution-admin-card').filter({has:page.locator('p.eyebrow').filter({hasText:'Selected cohort'})});
 const metric=label=>pulse.locator('article').filter({has:page.locator('span').filter({hasText:label})}).locator('strong');
 async function showMetrics(coverage,revision){await cohortButton('Reporting five').click();await expect(metric('Saved activity responses')).toHaveText('5');await expect(metric('Evidence review coverage')).toHaveText(coverage+'%');await expect(metric('Items needing revision')).toHaveText(String(revision));}
 await showMetrics(0,0);
 expect((await review('pending')).status).toBe(200);await page.reload();await showMetrics(0,0);
 expect((await review('needs-revision')).status).toBe(200);await page.reload();await showMetrics(20,1);
 const old=values[0];values[0]+=' revised';await save(0,values[0]);await page.reload();await showMetrics(0,0);
 const stale=await review('accepted',old);expect(stale.status).toBe(400);expect(stale.data.code).toBe('P0001');
 expect((await review('accepted')).status).toBe(200);await page.reload();await showMetrics(20,0);
 let unblock;const gate=new Promise(resolve=>{unblock=resolve;});let intercepted=0;
 const delay=async route=>{if(new URL(route.request().url()).searchParams.get('cohort_id')==='eq.'+fixtures.emptyCohortId){intercepted++;await gate;}await route.continue();};
 await page.route('**/rest/v1/cohort_enrolments?**',delay);
 await cohortButton('Empty switch').click();await expect.poll(()=>intercepted).toBeGreaterThan(0);
 await expect(selected).toContainText('Loading the selected cohort');await expect(selected.locator('.institution-admin-person-list article')).toHaveCount(0);await expect(pulse).toContainText('Preparing cohort learning summary');
 // Finish an older cohort request after returning to the five-learner cohort.
 await showMetrics(20,0);unblock();await page.unroute('**/rest/v1/cohort_enrolments?**',delay);await expect(selected.locator('.institution-admin-person-list article')).toHaveCount(6);await expect(metric('Saved activity responses')).toHaveText('5');
 await cohortButton('Empty switch').click();await expect(selected).toContainText('No learners enrolled yet.');await expect(pulse).toContainText('at least five learners are actively enrolled');
 const failure=async route=>{if(new URL(route.request().url()).searchParams.get('cohort_id')==='eq.'+fixtures.reportingCohortId)await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'Injected isolated test failure',code:'TEST'})});else await route.continue();};
 await page.route('**/rest/v1/cohort_enrolments?**',failure);await cohortButton('Reporting five').click();await expect(selected).toContainText('could not be loaded');await expect(selected.locator('.institution-admin-person-list article')).toHaveCount(0);await expect(pulse).toContainText('temporarily unavailable');await expect(page.locator('.institution-admin-metrics').first().locator('strong').nth(2)).toHaveText('—');
 await page.unroute('**/rest/v1/cohort_enrolments?**',failure);await selected.getByRole('button',{name:'Try again',exact:true}).click();await expect(metric('Evidence review coverage')).toHaveText('20%');await expect(selected.locator('.institution-admin-person-list article')).toHaveCount(6);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
});
