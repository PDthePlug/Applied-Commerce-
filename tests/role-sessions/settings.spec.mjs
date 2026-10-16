import {test,expect} from '@playwright/test';
import {loadRoleFixtures,verifyHostedTarget} from '../../scripts/lib/validation-target.mjs';
const {config,fixtures}=loadRoleFixtures(process.env.AC_ROLE_FIXTURES);
test.beforeAll(async({baseURL})=>{await verifyHostedTarget(baseURL,config,process.env.AC_EXPECTED_COMMIT);});

async function login(page,user){
 await page.goto('/auth',{waitUntil:'domcontentloaded'});
 await page.locator('.auth-form').getByLabel('Email address',{exact:true}).fill(user.email);
 await page.locator('.auth-form').getByLabel('Password',{exact:true}).fill(user.password);
 await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true})).toBeVisible({timeout:60000});
}
async function prefs(context){const response=await context.request.get('/api/preferences');expect(response.status()).toBe(200);return (await response.json()).preferences;}
async function saved(page){await expect(page.locator('.settings-status').filter({hasText:'Saved to your account'})).toBeVisible();}
async function settings(page,category='Appearance'){
 await page.goto('/settings',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:new RegExp(category)}).click();
 await expect(page.getByLabel(category==='Reading'?'Text size':'Theme')).toBeEnabled();
}

test('account preferences persist across devices, recover failed writes and enforce account-switch boundaries',async({browser,baseURL},testInfo)=>{
 const contexts=[];
 const context=async()=>{const result=await browser.newContext({baseURL,viewport:testInfo.project.use.viewport});contexts.push(result);return result;};
 try{
  const a=await context(),b=await context(),pa=await a.newPage(),pb=await b.newPage();
  await Promise.all([login(pa,fixtures.users.learner),login(pb,fixtures.users.learner)]);
  const reset=await a.request.patch('/api/preferences',{headers:{origin:baseURL,'x-ac-expected-user-id':fixtures.users.learner.id},data:{appearance:'light',accent:'commerce',textSize:'standard',readingWidth:'standard'}});expect(reset.status()).toBe(200);
  await Promise.all([settings(pa),settings(pb)]);
  await pa.getByLabel('Theme').selectOption('warm');await saved(pa);expect((await prefs(a)).appearance).toBe('warm');
  await pb.reload();await expect(pb.locator('html')).toHaveAttribute('data-ac-appearance','warm');
  await pb.getByRole('button',{name:/Appearance/}).click();await pb.getByRole('button',{name:'Blue',exact:true}).click();await saved(pb);
  await pa.getByRole('button',{name:/Reading/}).click();await pa.getByLabel('Text size').selectOption('large');await saved(pa);
  expect(await prefs(a)).toMatchObject({appearance:'warm',accent:'blue',textSize:'large'});
  await pb.reload();await expect(pb.locator('html')).toHaveAttribute('data-ac-text-size','large');await expect(pb.locator('html')).toHaveAttribute('data-ac-accent','blue');
  console.log('SETTINGS cross-device partial patches persisted');
  const fail=route=>route.request().method()==='PATCH'?route.fulfill({status:503,contentType:'application/json',body:'{"error":"Isolated injected write failure"}'}):route.continue();
  await pa.route('**/api/preferences',fail);await pa.getByRole('button',{name:/Appearance/}).click();await pa.getByLabel('Theme').selectOption('dark');
  await expect(pa.locator('.settings-status.settings-error')).toContainText('previous preferences have been restored');
  await expect(pa.locator('html')).toHaveAttribute('data-ac-appearance','warm');expect((await prefs(b)).appearance).toBe('warm');
  await pa.unroute('**/api/preferences',fail);await pa.getByRole('button',{name:'Retry',exact:true}).click();
  await expect(pa.getByLabel('Theme')).toBeEnabled();await pa.getByLabel('Theme').selectOption('dark');await saved(pa);expect((await prefs(a)).appearance).toBe('dark');
  console.log('SETTINGS failed write rolled back and retry persisted');
  await pa.goto('/auth',{waitUntil:'domcontentloaded'});await pa.getByRole('button',{name:'Sign out',exact:true}).click();await expect(pa.getByLabel('Email address',{exact:true})).toBeVisible();
  // Supabase's global sign-out also invalidates the second device's session.
  expect((await b.request.get('/api/preferences')).status()).toBe(401);
  await login(pa,fixtures.users.other);const before=await prefs(a);
  const mismatch=await a.request.patch('/api/preferences',{headers:{origin:baseURL,'x-ac-expected-user-id':fixtures.users.learner.id},data:{appearance:'dark'}});
  expect(mismatch.status()).toBe(409);expect(await prefs(a)).toEqual(before);
  await settings(pa);const otherTheme=before.appearance==='light'?'warm':'light';await pa.getByLabel('Theme').selectOption(otherTheme);await saved(pa);
  const fresh=await context(),freshPage=await fresh.newPage();await login(freshPage,fixtures.users.learner);await settings(freshPage);await expect(freshPage.locator('html')).toHaveAttribute('data-ac-appearance','dark');
  expect((await prefs(a)).appearance).toBe(otherTheme);
  console.log('SETTINGS revoked device and switched-account requests denied; preferences remain isolated');
 }finally{await Promise.all(contexts.map(context=>context.close()));}
});

test('facilitator and both administrator roles persist their own reading preferences',async({browser,baseURL},testInfo)=>{
 await Promise.all(['facilitator','schoolAdmin','platformAdmin'].map(async actor=>{
  const context=await browser.newContext({baseURL,viewport:testInfo.project.use.viewport});
  try{
   const page=await context.newPage();await login(page,fixtures.users[actor]);await settings(page,'Reading');
   const select=page.getByLabel('Reading width');const value=await select.inputValue()==='wide'?'narrow':'wide';
   await select.selectOption(value);await saved(page);expect((await prefs(context)).readingWidth).toBe(value);
   await page.reload();await expect(page.locator('html')).toHaveAttribute('data-ac-reading-width',value);
   console.log('SETTINGS '+actor+' reading preference persisted');
  }finally{await context.close();}
 }));
});

test('a refreshed account profile updates untouched fields without discarding an unsaved name',async({browser,baseURL},testInfo)=>{
 const user=fixtures.reportingLearners[4],contexts=[];
 const auth=await fetch(config.url+'/auth/v1/token?grant_type=password',{signal:AbortSignal.timeout(30000),method:'POST',headers:{apikey:config.key,'Content-Type':'application/json'},body:JSON.stringify({email:user.email,password:user.password})});expect(auth.status).toBe(200);
 const session=await auth.json();
 async function owner(path,body){const response=await fetch(config.url+path,{signal:AbortSignal.timeout(30000),method:body?'POST':'GET',headers:{apikey:config.key,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});expect(response.status).toBe(200);return response.json();}
 const path='/rest/v1/learner_profiles?select=preferred_name,current_grade,sync_revision&user_id=eq.'+user.id;
 const original=(await owner(path))[0];expect(original).toBeTruthy();
 try{
  const a=await browser.newContext({baseURL,viewport:testInfo.project.use.viewport}),b=await browser.newContext({baseURL,viewport:testInfo.project.use.viewport});contexts.push(a,b);
  const pa=await a.newPage(),pb=await b.newPage();await Promise.all([login(pa,user),login(pb,user)]);
  await Promise.all([pa.goto('/settings',{waitUntil:'domcontentloaded'}),pb.goto('/settings',{waitUntil:'domcontentloaded'})]);
  await expect(pa.getByLabel('Preferred name')).toHaveValue(original.preferred_name);await expect(pb.getByLabel('Preferred name')).toHaveValue(original.preferred_name);
  const first='Updated on another device '+Date.now();await pb.getByLabel('Preferred name').fill(first);await pb.getByLabel('Current grade').selectOption('9');await pb.getByRole('button',{name:'Save profile',exact:true}).click();
  await expect.poll(()=>owner(path).then(rows=>rows[0]?.preferred_name)).toBe(first);
  await pa.reload();await expect(pa.getByLabel('Preferred name')).toHaveValue(first);await expect(pa.getByLabel('Current grade')).toHaveValue('9');
  const draft='Unsaved name to preserve '+Date.now();await pa.getByLabel('Preferred name').fill(draft);
  const second='Another saved profile '+Date.now();await pb.getByLabel('Preferred name').fill(second);await pb.getByLabel('Current grade').selectOption('10');await pb.getByRole('button',{name:'Save profile',exact:true}).click();
  await expect.poll(()=>owner(path).then(rows=>rows[0]?.preferred_name)).toBe(second);
  await pa.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(pa.getByLabel('Current grade')).toHaveValue('10');await expect(pa.getByLabel('Preferred name')).toHaveValue(draft);
  await pa.getByRole('button',{name:'Save profile',exact:true}).click();await expect.poll(()=>owner(path).then(rows=>({name:rows[0]?.preferred_name,grade:rows[0]?.current_grade}))).toEqual({name:draft,grade:10});
  await pb.reload();await expect(pb.getByLabel('Preferred name')).toHaveValue(draft);
  console.log('SETTINGS signed profile refresh preserved the draft and adopted the untouched grade');
 }finally{
  await Promise.all(contexts.map(context=>context.close()));
  const current=(await owner(path))[0];
  const restored=await owner('/rest/v1/rpc/save_learning_changes_for_account',{p_account_id:user.id,p_changes:[{kind:'profile',key:'self',value:{displayName:original.preferred_name??'',grade:original.current_grade},expected:current.sync_revision}]});expect(restored[0].conflict).toBe(false);
 }
});
