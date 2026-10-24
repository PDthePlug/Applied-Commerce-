// Genuine role check of a reproduced title overflow; no intercepted requests.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {loadRoleFixtures} from './lib/validation-target.mjs';
import {runtimeUnits} from './semantic-census.mjs';
process.umask(0o077);
const {config,fixtures}=loadRoleFixtures(process.env.AC_ROLE_FIXTURES);
assert.equal(config.projectRef,'inxshlumnhcgiahxqewe');
const baseURL=process.env.AC_ROLE_BASE_URL;
assert.ok(new URL(baseURL).hostname.startsWith('applied-commerce-sa-staging'));
const access=JSON.parse(JSON.parse(fs.readFileSync(process.env.AC_STAGING_ACCESS_FILE)).content[0].text);
const unit=(await runtimeUnits()).find(unit=>unit.id==='g9-t3-l39-028');
const baseline=process.env.AC_EXPECT_TITLE_OVERFLOW==='1';
const out=process.env.AC_STAGING_EVIDENCE_DIR;
fs.mkdirSync(out,{recursive:true,mode:0o700});
const result={authentication:'genuine staging password login',projectRef:config.projectRef,baselineBeforeFix:baseline,cases:[],pageErrors:[]};
const save=()=>fs.writeFileSync(process.env.AC_STAGING_RESULTS_FILE,JSON.stringify(result,null,2)+'\n');
const browser=await chromium.launch({executablePath:process.env.AC_BROWSER_EXECUTABLE,proxy:process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 const context=await browser.newContext({baseURL}),page=await context.newPage();
 page.on('pageerror',error=>result.pageErrors.push(error.name));
 await page.goto(access.shareableUrl);
 const health=await(await page.request.get('/api/health')).json();
 assert.equal(health.projectRef,config.projectRef);assert.equal(health.commit,process.env.AC_EXPECTED_COMMIT);result.commit=health.commit;
 await page.goto('/auth');await page.getByLabel('Email address',{exact:true}).fill(fixtures.users.facilitator.email);await page.getByLabel('Password',{exact:true}).fill(fixtures.users.facilitator.password);await page.locator('.auth-form').getByRole('button',{name:'Sign in',exact:true}).click();await page.locator('.auth-panel').getByRole('button',{name:'Sign out',exact:true}).waitFor({timeout:60000});
 for(const width of [320,360,430,768,1280]){
  await page.setViewportSize({width,height:900});await page.goto(`/learn/9/term/3/${unit.id}`);
  const heading=page.getByRole('heading',{level:1,name:unit.title,exact:true});await heading.waitFor();
  await page.evaluate(()=>document.fonts.ready);
  for(const mode of ['learner','teacher']){
   if(mode==='teacher'){await page.getByRole('button',{name:'Teacher View',exact:true}).click();await page.locator('[data-instructional-location="preparation"]').waitFor();}
   for(const scale of [1,1.28,2]){
    await page.evaluate(scale=>document.documentElement.style.setProperty('--ac-text-scale',String(scale)),scale);
    assert.equal(await heading.innerText(),unit.title);
    const geometry=await heading.evaluate(node=>({pageWidth:document.documentElement.scrollWidth,titleWidth:node.clientWidth,titleScrollWidth:node.scrollWidth,overflowX:getComputedStyle(node).overflowX,fontSize:getComputedStyle(node).fontSize}));
    result.cases.push({width,scale,mode,titleUnchanged:true,...geometry});
    if(!baseline){assert.ok(geometry.pageWidth<=width+1);assert.ok(geometry.titleScrollWidth<=geometry.titleWidth+1);assert.equal(geometry.overflowX,'visible');}
    if([320,1280].includes(width)&&[1,2].includes(scale)){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:out+`/title-${mode}-${width}-${scale}.png`,animations:'disabled'});}
    save();
   }
  }
 }
 result.overflowCases=result.cases.filter(row=>row.pageWidth>row.width+1).length;
 if(baseline)assert.ok(result.overflowCases>0);else assert.equal(result.overflowCases,0);
 assert.equal(result.pageErrors.length,0);save();
 console.log(JSON.stringify({cases:result.cases.length,overflowCases:result.overflowCases,baselineBeforeFix:baseline,commit:result.commit}));
}catch(error){result.failure=error.message;save();throw error;}finally{await browser.close();}
