// Genuine browser password login; no request interception or fabricated session.
import fs from 'node:fs';
import {chromium} from '@playwright/test';
import {loadRoleFixtures} from './lib/validation-target.mjs';
const directory=process.env.AC_ROLE_FIXTURES;
const {config,fixtures}=loadRoleFixtures(directory);
const baseURL=process.env.AC_ROLE_BASE_URL??'https://applied-commerce-sa-staging-iki6enora.vercel.app';
if(!new URL(baseURL).hostname.startsWith('applied-commerce-sa-staging'))throw Error('Staging deployment required');
const access=JSON.parse(JSON.parse(fs.readFileSync(directory+'/vercel-access.json')).content[0].text);
const proxy=process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY,bypass:'localhost,127.0.0.1'}:undefined;
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy,args:['--no-sandbox','--disable-dev-shm-usage']});
const results=[];
try{
 for(const role of ['platformAdmin','facilitator','learner','unassigned','schoolAdmin','other']){
  const context=await browser.newContext({baseURL});const page=await context.newPage();
  try{
   await page.goto(access.shareableUrl,{waitUntil:'domcontentloaded'});
   const health=await page.request.get('/api/health');const h=await health.json();
   if(h.projectRef!==config.projectRef)throw Error('Staging project differs');
   await page.goto('/auth');
   await page.getByLabel('Email address',{exact:true}).fill(fixtures.users[role].email);
   await page.getByLabel('Password',{exact:true}).fill(fixtures.users[role].password);
   await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();
   await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});
   const samples=[];let payload;
   for(let i=0;i<(role==='facilitator'?5:1);i++){
    const start=performance.now();const response=await page.request.get('/api/classroom?lesson=g8-t1-l01-001');const body=await response.body();
    samples.push({status:response.status(),ms:Math.round(performance.now()-start),bytes:body.length,cacheControl:response.headers()['cache-control']});
    if(response.ok())payload=JSON.parse(body);
   }
   const row={role,login:true,commit:h.commit,samples};results.push(row);
   if(role==='facilitator'&&payload){
    fs.mkdirSync(directory+'/plans',{mode:0o700});
    for(const id of JSON.parse(fs.readFileSync('content/instructional/teaching-availability.v2.json')).lessonIds){
     const response=await page.request.get('/api/classroom?lesson='+id);if(!response.ok())throw Error('Authorised plan request failed');
     fs.writeFileSync(directory+'/plans/'+id+'.json',JSON.stringify(await response.json()),{mode:0o600});
    }
   }
   await context.close();
  }catch(error){results.push({role,error:error.message.replace(/https?:\/\/\S+/g,'[URL]')});await context.close();}
  fs.writeFileSync(directory+'/hosted-results.json',JSON.stringify(results,null,2),{mode:0o600});
 }
}finally{await browser.close();}
console.log(JSON.stringify(results));
