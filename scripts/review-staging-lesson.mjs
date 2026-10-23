import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {loadRoleFixtures} from './lib/validation-target.mjs';
const directory=process.env.AC_ROLE_FIXTURES;const {config,fixtures}=loadRoleFixtures(directory);
const baseURL=process.env.AC_ROLE_BASE_URL??'https://applied-commerce-sa-staging-927zc0d8z.vercel.app';
assert.ok(new URL(baseURL).hostname.startsWith('applied-commerce-sa-staging'));
const accessFile=process.env.AC_STAGING_ACCESS_FILE??directory+'/representative-access.json';
const access=JSON.parse(JSON.parse(fs.readFileSync(accessFile)).content[0].text);
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY,bypass:'localhost,127.0.0.1'}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
const checks=[];const privateDir=directory+'/classroom-evidence';fs.mkdirSync(privateDir,{recursive:true,mode:0o700});
const context=await browser.newContext({baseURL,viewport:{width:1280,height:900}});const page=await context.newPage();
try{
 await page.goto(access.shareableUrl);const health=await(await page.request.get('/api/health')).json();assert.equal(health.projectRef,config.projectRef);
 await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(fixtures.users.facilitator.email);await page.getByLabel('Password',{exact:true}).fill(fixtures.users.facilitator.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});
 for(const width of [320,360,430,768,1280,1920]){
  await page.setViewportSize({width,height:900});await page.goto('/learn/8/term/1/g8-t1-l01-001');await page.getByRole('button',{name:'Teacher View',exact:true}).click();
  const preparation=page.locator('[data-instructional-location="preparation"]');await preparation.waitFor();assert.equal(await preparation.getAttribute('open'),null);
  const stage=page.locator('[data-instructional-location="l1-stage-1"]');await stage.locator(':scope > summary').click();
  await stage.locator('[data-facilitation-cue]').waitFor();assert.equal(await stage.locator('.contextual-depth').getAttribute('open'),null);
  const cue=await stage.locator('[data-facilitation-cue]').innerText();assert.equal(cue,'Read the taxi and notebook scene in short turns.');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
  const fields=await page.locator('[data-instructional-field]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('data-instructional-field')));assert.equal(new Set(fields).size,82);
  await stage.scrollIntoViewIfNeeded();await page.screenshot({path:privateDir+'/representative-'+width+'.png'});
  await stage.locator('.contextual-depth > summary').click();await stage.locator('.contextual-depth p').first().waitFor();
  checks.push({width,preparationCollapsed:true,cue:true,localDepth:true,fields:new Set(fields).size,overflow:false});
 }
 fs.writeFileSync(directory+'/review-browser-results.json',JSON.stringify({commit:health.commit,projectRef:config.projectRef,authentication:'real staging browser password login',checks},null,2),{mode:0o600});
 console.log(JSON.stringify({commit:health.commit,passed:checks.length,checks}));
}finally{await browser.close();}
