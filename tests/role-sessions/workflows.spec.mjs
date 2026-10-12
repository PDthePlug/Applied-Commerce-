import {test,expect} from '@playwright/test';import fs from 'node:fs';
const directory=process.env.AC_ROLE_FIXTURES;
if(!directory)throw new Error('AC_ROLE_FIXTURES must name dedicated private test accounts');
const fixtures=JSON.parse(fs.readFileSync(directory+'/fixtures.json'));
const config=JSON.parse(fs.readFileSync(directory+'/public-config.json'));
const storage='applied-commerce-learning-state-v1:user:'+fixtures.users.learner.id;
const lesson='/learn/8/term/1/g8-t1-l01-001';
async function login(page,name){page.setDefaultTimeout(15000);page.on('requestfailed',r=>{const u=new URL(r.url());if(u.hostname.endsWith('.supabase.co'))console.log('SUPABASE_NETWORK '+u.pathname+' '+r.failure()?.errorText);});await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(fixtures.users[name].email);await page.getByLabel('Password',{exact:true}).fill(fixtures.users[name].password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.locator('.auth-panel')).toContainText(fixtures.users[name].email);await expect(page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true})).toBeVisible();}
let sessions={};
test.beforeEach(async()=>{for(const name of ['learner','facilitator']){const r=await fetch(config.url+'/auth/v1/token?grant_type=password',{signal:AbortSignal.timeout(20000),method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:fixtures.users[name].email,password:fixtures.users[name].password})});expect(r.status).toBe(200);sessions[name]=await r.json();}});
async function sessionRequest(actor,path,method='GET',body){const result=await fetch(config.url+path,{signal:AbortSignal.timeout(20000),method,headers:{apikey:config.key,Authorization:'Bearer '+sessions[actor].access_token,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});return {status:result.status,data:await result.json().catch(()=>null)};}
const hasBaseline=page=>expect.poll(()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{}').sync?.baseline!==undefined,storage)).toBe(true);
test('two real browser devices recover offline note conflicts without losing either version',async({browser,baseURL},testInfo)=>{
 const a=await browser.newContext({baseURL,ignoreHTTPSErrors:process.env.AC_TEST_PROXY_TLS_BYPASS==='1',viewport:testInfo.project.use.viewport}),b=await browser.newContext({baseURL,ignoreHTTPSErrors:process.env.AC_TEST_PROXY_TLS_BYPASS==='1',viewport:testInfo.project.use.viewport});const pa=await a.newPage(),pb=await b.newPage();
 try{
  await login(pa,'learner');await pa.goto(lesson);await hasBaseline(pa);
  const first='Account note '+Date.now();await pa.getByPlaceholder('Add a note about this lesson…').fill(first);
  await expect.poll(()=>sessionRequest('learner','/rest/v1/lesson_notes?select=note&learner_id=eq.'+fixtures.users.learner.id+'&unit_id=eq.g8-t1-l01-001').then(r=>r.data?.[0]?.note)).toBe(first);
  await login(pb,'learner');await pb.goto(lesson);await expect(pb.getByPlaceholder('Add a note about this lesson…')).toHaveValue(first);
  console.log('CONFLICT_BASELINE_READY');await b.setOffline(true);
  const mine='Offline note '+Date.now();await pb.getByPlaceholder('Add a note about this lesson…').fill(mine);
  const newer='Other device note '+Date.now();await pa.getByPlaceholder('Add a note about this lesson…').fill(newer);
  await expect.poll(()=>sessionRequest('learner','/rest/v1/lesson_notes?select=note&learner_id=eq.'+fixtures.users.learner.id+'&unit_id=eq.g8-t1-l01-001').then(r=>r.data?.[0]?.note)).toBe(newer);
  console.log('COMPETING_NOTE_SAVED');await b.setOffline(false);await pb.evaluate(()=>window.dispatchEvent(new Event('online')));
  await expect(pb.getByRole('heading',{name:'Work changed on another device'})).toBeVisible();
  console.log('CONFLICT_VISIBLE');const conflict=pb.locator('.learning-sync-status details').filter({hasText:'Lesson note'});await conflict.locator('summary').click();await expect(conflict).toContainText(mine);await expect(conflict).toContainText(newer);
  console.log('CHOOSING_LOCAL');await conflict.getByRole('button',{name:'Keep this device’s version'}).click();
  await expect.poll(()=>sessionRequest('learner','/rest/v1/lesson_notes?select=note&learner_id=eq.'+fixtures.users.learner.id+'&unit_id=eq.g8-t1-l01-001').then(r=>r.data?.[0]?.note)).toBe(mine);
  await expect.poll(()=>pb.evaluate(key=>JSON.parse(localStorage.getItem(key)).sync?.history?.some(x=>x.local.value.startsWith('Offline note')&&x.remote.value.startsWith('Other device note')),storage)).toBe(true);
  console.log('RESOLUTION_PERSISTED');await pb.reload();await expect(pb.getByPlaceholder('Add a note about this lesson…')).toHaveValue(mine);
  await pa.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(pa.getByPlaceholder('Add a note about this lesson…')).toHaveValue(mine);
  // Exercise the other explicit resolution choice as well.
  await b.setOffline(true);await pb.getByPlaceholder('Add a note about this lesson…').fill('Local version to preserve in history');
  const accountChoice='Choose account version '+Date.now();await pa.getByPlaceholder('Add a note about this lesson…').fill(accountChoice);
  await expect.poll(()=>sessionRequest('learner','/rest/v1/lesson_notes?select=note&learner_id=eq.'+fixtures.users.learner.id+'&unit_id=eq.g8-t1-l01-001').then(r=>r.data?.[0]?.note)).toBe(accountChoice);
  await b.setOffline(false);await pb.evaluate(()=>window.dispatchEvent(new Event('online')));
  const second=pb.locator('.learning-sync-status details').filter({hasText:'Lesson note'});await expect(second).toBeVisible();await second.locator('summary').click();await second.getByRole('button',{name:'Use saved account version'}).click();
  await expect(pb.getByPlaceholder('Add a note about this lesson…')).toHaveValue(accountChoice);
  await expect.poll(()=>pb.evaluate(key=>JSON.parse(localStorage.getItem(key)).sync?.history?.some(x=>x.local.value==='Local version to preserve in history'),storage)).toBe(true);
  expect(await pb.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 }finally{await a.close();await b.close();}
});

test('real learner, facilitator and administrator browser workflow follows revised authored evidence',async({browser,baseURL},testInfo)=>{
 const contexts=[];async function account(name){const c=await browser.newContext({baseURL,ignoreHTTPSErrors:process.env.AC_TEST_PROXY_TLS_BYPASS==='1',viewport:testInfo.project.use.viewport});contexts.push(c);const p=await c.newPage();await login(p,name);return p;}
 try{
  const learner=await account('learner');await learner.goto(lesson);await hasBaseline(learner);
  const response=learner.locator('.lesson-document textarea').first();await expect(response).toBeVisible();
  const answer='Dedicated browser evidence '+Date.now();await response.fill(answer);
  let key;await expect.poll(async()=>{const rows=await sessionRequest('facilitator','/rest/v1/prompt_responses?select=prompt_key,response&learner_id=eq.'+fixtures.users.learner.id);key=rows.data?.find(x=>x.response===answer)?.prompt_key;return Boolean(key);}).toBe(true);
  const facilitator=await account('facilitator');await facilitator.goto('/facilitator/review');await expect(facilitator.locator('.fac-evidence-card')).toContainText(answer);
  await facilitator.getByLabel(/Facilitator feedback/).fill('Dedicated browser feedback: add a concrete example.');
  await facilitator.getByRole('button',{name:'Needs revision',exact:true}).click();
  await expect.poll(()=>sessionRequest('learner','/rest/v1/evidence_records?select=status&learner_id=eq.'+fixtures.users.learner.id+'&response_key=eq.'+key).then(x=>x.data?.[0]?.status)).toBe('needs-revision');
  await learner.goto('/portfolio');await expect(learner.locator('main').last()).toContainText('Dedicated browser feedback: add a concrete example.');
  await learner.goto(lesson);const revised=answer+' with a concrete example';await learner.locator('.lesson-document textarea').first().fill(revised);
  await expect.poll(()=>sessionRequest('facilitator','/rest/v1/prompt_responses?select=response&learner_id=eq.'+fixtures.users.learner.id+'&prompt_key=eq.'+key).then(x=>x.data?.[0]?.response)).toBe(revised);
  await facilitator.reload();await expect(facilitator.locator('.fac-evidence-card')).toContainText(revised);
  for(const select of await facilitator.locator('.fac-rubric-criteria select').all())await select.selectOption('3');
  await facilitator.getByRole('button',{name:/Accept & next|Verify & next/}).click();
  await expect.poll(()=>sessionRequest('learner','/rest/v1/evidence_reviews?select=status,response_value_at_review').then(r=>r.data?.find(x=>x.response_value_at_review===revised)?.status)).toMatch(/accepted|verified/);
  await learner.goto('/portfolio');await expect(learner.locator('main').last()).toContainText(/Accepted|Verified/i);
  const schoolAdmin=await account('schoolAdmin');await schoolAdmin.goto('/institution-admin');await expect(schoolAdmin.locator('main').last()).toContainText(fixtures.run);
  const platform=await account('platformAdmin');await platform.goto('/institutions/manage');await expect(platform.locator('main').last()).toContainText(fixtures.run);
  // An unrelated learner cannot enter staff or administrator workspaces.
  const other=await account('other');await other.goto('/facilitator');await expect(other.locator('main').last()).toContainText(/access|assigned|facilitator/i);await expect(other.locator('.fac-evidence-card')).toHaveCount(0);
  await learner.goto('/auth');await learner.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).click();await expect(learner.getByLabel('Email address',{exact:true})).toBeVisible();
  await login(learner,'other');await learner.goto(lesson);await expect(learner.locator('.lesson-document textarea').first()).not.toHaveValue(revised);
 }finally{for(const context of contexts)await context.close();}
});
