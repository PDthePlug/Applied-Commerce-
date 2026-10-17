import fs from 'node:fs';
import zlib from 'node:zlib';
import {test,expect} from '@playwright/test';
import {loadRoleFixtures,verifyHostedTarget} from '../../scripts/lib/validation-target.mjs';
const directory=process.env.AC_ROLE_FIXTURES;
const {config,fixtures}=loadRoleFixtures(directory);
const index=JSON.parse(fs.readFileSync('public/curriculum/index.json','utf8'));
const grade=index.grades.find(g=>g.grade===8);
function bundle(meta){const encoded=Array.from({length:meta.bundleParts},(_,i)=>fs.readFileSync(`public/curriculum/grade-${meta.grade}.part-${i+1}.b64`,'utf8').trim()).join('');return JSON.parse(zlib.gunzipSync(Buffer.from(encoded,'base64')));}
const grade9=index.grades.find(g=>g.grade===9);
const assessment=bundle(grade9).terms.flatMap(term=>term.units).find(unit=>unit.type==='assessment');
const unit=bundle(grade).terms[0].units.find(u=>u.id==='g8-t1-l01-001');
const block=unit.blocks.find(b=>b.kind==='text'&&b.type==='activity');
const key=unit.id+'::prompt-'+block.id+'::response';
const sessions={};
async function request(actor,path,method='GET',body){const r=await fetch(config.url+path,{method,signal:AbortSignal.timeout(30000),headers:{apikey:config.key,'Content-Type':'application/json',...(actor?{Authorization:'Bearer '+sessions[actor].access_token}:{}),Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json().catch(()=>null)};}
async function rpc(actor,name,body){const r=await request(actor,'/rest/v1/rpc/'+name,'POST',body);expect(r.status,`${name}: HTTP ${r.status}`).toBe(200);return r.data;}
async function login(page,actor='schoolAdmin'){const user=typeof actor==='string'?fixtures.users[actor]:actor;await page.goto('/auth',{waitUntil:'domcontentloaded'});await page.locator('.auth-form').getByLabel('Email address',{exact:true}).fill(user.email);await page.locator('.auth-form').getByLabel('Password',{exact:true}).fill(user.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.locator('.auth-panel')).toContainText(user.email,{timeout:60000});}
test.beforeAll(async({baseURL})=>{await verifyHostedTarget(baseURL,config,process.env.AC_EXPECTED_COMMIT);expect(fixtures.reportingLearners?.length,'Prepare append fixtures with five dedicated reporting learners').toBe(5);});
test('real cohort metrics follow pending, revision and acceptance; switches and failed loads cannot show another cohort',async({page,browser,baseURL},testInfo)=>{
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
 for(let i=0;i<5;i++){
  const user=fixtures.reportingLearners[i];
  const profile=await request('report'+i,'/rest/v1/learner_profiles?select=sync_revision&user_id=eq.'+user.id);expect(profile.status).toBe(200);
  const saved=await rpc('report'+i,'save_learning_changes_for_account',{p_account_id:user.id,p_changes:[{kind:'profile',key:'self',value:{displayName:fixtures.run+' reportLearner'+i,grade:i===1?9:8},expected:profile.data[0]?.sync_revision??0}]});expect(saved[0].conflict).toBe(false);
  values[i]='Dedicated reporting answer '+Date.now()+' '+i;await save(i,values[i]);
 }
 console.log('REPORTING five named learners provisioned through account APIs');
 // Retain two real lessons, an assessment and a historical ID on one account.
 const completionIds=[grade.lessonIds[0],grade9.lessonIds[0],assessment.id,'g8-t1-l99-999'];
 const progress=await request('report1','/rest/v1/lesson_progress?select=unit_id,sync_revision&learner_id=eq.'+fixtures.reportingLearners[1].id+'&unit_id=in.('+completionIds.join(',')+')');expect(progress.status).toBe(200);
 const revisions=new Map(progress.data.map(row=>[row.unit_id,row.sync_revision]));
 const completions=await rpc('report1','save_learning_changes_for_account',{p_account_id:fixtures.reportingLearners[1].id,p_changes:completionIds.map(key=>({kind:'completion',key,value:true,expected:revisions.get(key)??0}))});expect(completions.every(row=>!row.conflict)).toBe(true);
 const retained=await request('report1','/rest/v1/lesson_progress?select=unit_id&status=eq.completed&learner_id=eq.'+fixtures.reportingLearners[1].id+'&unit_id=in.('+completionIds.join(',')+')');expect(retained.data).toHaveLength(4);
 async function review(status,value=values[0]){return request('facilitator','/rest/v1/rpc/save_facilitator_review','POST',{p_learner_id:fixtures.reportingLearners[0].id,p_response_key:key,p_response_value:value,p_auto_result:{},p_review:{status,criteria:{},feedback:'Dedicated reporting '+status}});}
 await login(page);await page.goto('/institutions/manage');
 const cohortButton=name=>page.locator('.institution-admin-list button').filter({hasText:name});
 const pulse=page.locator('.institution-admin-card').filter({has:page.getByRole('heading',{name:'Learning and evidence coverage',exact:true})});
 const selected=page.locator('.institution-admin-card').filter({has:page.locator('p.eyebrow').filter({hasText:'Selected cohort'})});
 const metric=label=>pulse.locator('article').filter({has:page.locator('span').filter({hasText:label})}).locator('strong');
 async function showMetrics(coverage,revision){await cohortButton('Reporting five').click();await expect(metric('Saved activity responses')).toHaveText('5');await expect(metric('Lessons completed')).toHaveText('2');await expect(metric('Evidence review coverage')).toHaveText(coverage+'%');await expect(metric('Items needing revision')).toHaveText(String(revision));}
 await showMetrics(0,0);console.log('REPORTING five answers: 0%');
 expect((await review('pending')).status).toBe(200);await page.reload();await showMetrics(0,0);console.log('REPORTING pending decision: 0%');
 expect((await review('needs-revision')).status).toBe(200);await page.reload();await showMetrics(20,1);console.log('REPORTING needs revision: 20%');
 const old=values[0];values[0]+=' revised';await save(0,values[0]);await page.reload();await showMetrics(0,0);
 const stale=await review('accepted',old);expect(stale.status).toBe(400);expect(stale.data.code).toBe('P0001');
 expect((await review('accepted')).status).toBe(200);await page.reload();await showMetrics(20,0);console.log('REPORTING current acceptance: 20%');
 const learnerContext=await browser.newContext({baseURL,viewport:page.viewportSize()});
 try{
  const learner=await learnerContext.newPage();await login(learner,fixtures.reportingLearners[1]);await learner.goto('/');
  await expect(learner.locator('.home-today-status')).toContainText('1 of '+grade9.lessonIds.length+' lessons complete');
  await learner.goto('/learn');await expect(learner.locator('.grade-card.grade-9')).toContainText('1%');await expect(learner.locator('.grade-card.grade-8')).toContainText('1%');
  await learner.goto('/learn/9');await expect(learner.locator('.grade-progress')).toContainText('1 of '+grade9.lessonIds.length+' lessons complete');
  await learner.goto('/progress');await expect(learner.locator('.progress-grade-list a[href="/learn/9"]')).toContainText('1 of '+grade9.lessonIds.length+' completed');
  console.log('REPORTING authenticated learner home, library, grade map and progress agree; retained assessment and historical IDs do not inflate lesson progress');
 }finally{await learnerContext.close();}

 let unblock;const gate=new Promise(resolve=>{unblock=resolve;});let intercepted=0;
 const delay=async route=>{if(new URL(route.request().url()).searchParams.get('cohort_id')==='eq.'+fixtures.emptyCohortId){intercepted++;await gate;}await route.continue();};
 await page.route('**/rest/v1/cohort_enrolments?**',delay);
 await cohortButton('Empty switch').click();await expect.poll(()=>intercepted).toBeGreaterThan(0);
 await expect(selected).toContainText('Loading the selected cohort');await expect(selected.locator('.institution-admin-person-list article')).toHaveCount(0);await expect(pulse).toContainText('Preparing cohort learning summary');
 // Finish an older cohort request after returning to the five-learner cohort.
 await showMetrics(20,0);unblock();await page.unrouteAll({behavior:'wait'});await expect(selected.locator('.institution-admin-person-list article')).toHaveCount(6);await expect(metric('Saved activity responses')).toHaveText('5');
 await cohortButton('Empty switch').click();await expect(selected).toContainText('No learners enrolled yet.');await expect(pulse).toContainText('at least five learners are actively enrolled');
 const failure=async route=>{if(new URL(route.request().url()).searchParams.get('cohort_id')==='eq.'+fixtures.reportingCohortId)await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({message:'Injected isolated test failure',code:'TEST'})});else await route.continue();};
 await page.route('**/rest/v1/cohort_enrolments?**',failure);await cohortButton('Reporting five').click();await expect(selected).toContainText('could not be loaded');await expect(selected.locator('.institution-admin-person-list article')).toHaveCount(0);await expect(pulse).toContainText('temporarily unavailable');await expect(page.locator('.institution-admin-metrics').first().locator('strong').nth(2)).toHaveText('—');
 await page.unroute('**/rest/v1/cohort_enrolments?**',failure);await selected.getByRole('button',{name:'Try again',exact:true}).click();await expect(metric('Evidence review coverage')).toHaveText('20%');await expect(selected.locator('.institution-admin-person-list article')).toHaveCount(6);await expect(page.locator('.institution-admin-alert.error')).toHaveCount(0);console.log('REPORTING cohort delay, failure and retry recovered');
 // Select a non-first learner, then follow the real review/report controls.
 const facilitatorContext=await browser.newContext({baseURL,viewport:page.viewportSize()});
 try{
  console.log('REPORTING checking non-first learner navigation');const facilitator=await facilitatorContext.newPage();await login(facilitator,'facilitator');await facilitator.goto('/facilitator/learners');
  const mixed=facilitator.locator('.fac-roster-row').filter({hasText:fixtures.run+' reportLearner1'});
  await expect(mixed).toContainText('1/'+grade9.lessonIds.length);await mixed.click();
  await expect(facilitator.locator('.fac-roster-row').filter({hasText:fixtures.run+' reportLearner4'})).toContainText('0/'+grade.lessonIds.length);
  await facilitator.getByRole('button',{name:'Open report',exact:true}).click();await expect(facilitator.getByText('1/'+grade9.lessonIds.length+' lessons',{exact:true})).toBeVisible();
  await facilitator.goto('/facilitator/learners');console.log('REPORTING mixed-grade progress agrees across administrator, roster and learner report');
  const name=fixtures.run+' reportLearner4';
  await facilitator.locator('.fac-roster-row').filter({hasText:name}).click();await expect(facilitator.locator('.fac-learner-detail h2')).toHaveText(name);await facilitator.reload();await expect(facilitator.locator('.fac-learner-detail h2')).toHaveText(name);
  await facilitator.getByRole('button',{name:'Review evidence',exact:true}).click();await expect(facilitator).toHaveURL(new RegExp('learner='+fixtures.reportingLearners[4].id));await expect(facilitator.locator('.fac-evidence-card')).toContainText(values[4]);
  await facilitator.reload();await expect(facilitator.locator('.fac-evidence-card')).toContainText(values[4]);
  await facilitator.goto('/facilitator/learners?learner='+fixtures.reportingLearners[4].id);await expect(facilitator.locator('.fac-learner-detail h2')).toHaveText(name);
  await facilitator.getByRole('button',{name:'Open report',exact:true}).click();await expect(facilitator).toHaveURL(new RegExp('learner='+fixtures.reportingLearners[4].id));await expect(facilitator.locator('.fac-report-actions')).toContainText(name);
  const reportUrl=facilitator.url();await facilitator.goto('/settings');await facilitator.getByRole('button',{name:/Appearance/}).click();
  const theme=facilitator.getByLabel('Theme');await expect(theme).toBeEnabled();const priorTheme=await theme.inputValue();
  try{
   await theme.selectOption('dark');await expect(facilitator.locator('.settings-status').filter({hasText:'Saved to your account'})).toBeVisible();
   await facilitator.goto(reportUrl);await expect(facilitator.locator('.fac-report-sheet header strong')).toHaveText(name);
   if(testInfo.project.name==='roles-mobile')await facilitator.locator('.fac-menu-trigger').click();
   await facilitator.emulateMedia({media:'print',colorScheme:'dark'});
   for(const selector of ['.fac-menu-trigger','.fac-menu-sheet','.fac-menu-scrim','.fac-report-actions'])await expect(facilitator.locator(selector)).toBeHidden();
   const ratio=await facilitator.locator('.fac-report-sheet header h2').evaluate(el=>{
    const luminance=color=>{const [r,g,b]=color.match(/[\d.]+/g).slice(0,3).map(Number).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return .2126*r+.7152*g+.0722*b;};
    const a=luminance(getComputedStyle(el).color),b=luminance(getComputedStyle(el.closest('.fac-report-sheet')).backgroundColor);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
   });expect(ratio,'authenticated dark-mode report print contrast').toBeGreaterThanOrEqual(4.5);
   await facilitator.pdf({path:testInfo.outputPath('learner-report.pdf'),format:'A4',printBackground:true});
   console.log('REPORTING actual learner report PDF generated; print heading contrast '+ratio.toFixed(2)+':1 and mobile navigation excluded');
  }finally{
   await facilitator.emulateMedia({media:'screen'});await facilitator.goto('/settings');await facilitator.getByRole('button',{name:/Appearance/}).click();await expect(facilitator.getByLabel('Theme')).toBeEnabled();await facilitator.getByLabel('Theme').selectOption(priorTheme);await expect(facilitator.locator('.settings-status').filter({hasText:'Saved to your account'})).toBeVisible();
  }
  await facilitator.goto('/facilitator/learners?learner='+fixtures.users.unassigned.id);await expect(facilitator.locator('.fac-roster-row.active')).toHaveCount(1);await expect(facilitator.locator('.fac-roster-row.active')).not.toContainText(fixtures.run+' unassigned');
  console.log('REPORTING roster selection survives review, report and refresh; unrelated IDs stay outside the roster');
 }finally{await facilitatorContext.close();}
 const dimensions=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth}));
 expect(dimensions.document,'Institution cards must fit the viewport with real cohort and learner names').toBeLessThanOrEqual(dimensions.viewport+1);
});
