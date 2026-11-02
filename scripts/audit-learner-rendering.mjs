import fs from 'node:fs';
import {chromium} from '@playwright/test';
import {runtimeUnits} from './semantic-census.mjs';
const phase=process.argv[2]??'before';
if(!['before','after'].includes(phase))throw new Error('Choose before or after');
const origin=process.env.AC_AUDIT_ORIGIN??'http://127.0.0.1:3100';
if(!/^http:\/\/(?:127\.0\.0\.1|localhost):\d+$/.test(origin))throw new Error('This unattended census only targets a local backend build');
const health=await fetch(origin+'/api/health');const target=await health.json();if(health.status!==503||target.projectRef!==null)throw new Error('This census requires a verified local backend build without a Supabase target');
const dir=`test-results/learner-hardening/${phase}`;fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,...(process.env.AC_BROWSER_EXECUTABLE?{executablePath:process.env.AC_BROWSER_EXECUTABLE}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const units=await runtimeUnits();const results=[];
try{
 const context=await browser.newContext({viewport:{width:1280,height:900}});const page=await context.newPage();let errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const unit of units){
  errors=[];await page.goto(`${origin}/learn/${unit.grade}/term/${unit.term}/${unit.id}`,{waitUntil:'domcontentloaded'});await page.locator('.semantic-learning-document').waitFor();
  const actual=await page.locator('.semantic-learning-document').evaluate(root=>({renderer:root.getAttribute('data-semantic-renderer'),fields:[...root.querySelectorAll('input,textarea,select')].map(e=>({tag:e.tagName,id:e.id,label:e.getAttribute('aria-label')??e.closest('label')?.textContent?.trim(),value:e.value})),panels:root.querySelectorAll('.deepening-insight').length,wraps:root.querySelectorAll('.lesson-wrap').length,sections:[...root.querySelectorAll(':scope > .learning-section')].map(s=>({id:s.id,controls:s.querySelectorAll('input,textarea,select,button').length})),overflow:document.documentElement.scrollWidth>innerWidth+1}));
  results.push({unitId:unit.id,grade:unit.grade,term:unit.term,lesson:unit.startLesson,type:unit.type,...actual,errors:[...errors]});
 }
 for(const width of [320,360,430,768,1280,1920])for(const [grade,number]of[[8,3],[8,16],[9,1],[10,46],[11,22],[12,53]]){
  const unit=units.find(u=>u.grade===grade&&u.startLesson===number&&u.type==='lesson');await page.setViewportSize({width,height:900});await page.goto(`${origin}/learn/${grade}/term/${unit.term}/${unit.id}`);await page.locator('.semantic-learning-document').waitFor();await page.screenshot({path:`${dir}/g${grade}-l${number}-${width}.png`,fullPage:true,animations:'disabled'});
 }
 fs.writeFileSync(`${dir}/rendered-census.json`,JSON.stringify({origin,phase,units:results},null,2));console.log(JSON.stringify({phase,units:results.length,errors:results.filter(r=>r.errors.length).length,overflow:results.filter(r=>r.overflow).length,screenshots:36}));
}finally{await browser.close();}
