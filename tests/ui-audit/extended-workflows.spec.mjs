import { test, expect } from '@playwright/test';
import { runtimeUnits } from '../../scripts/semantic-census.mjs';
import {surfaceReady} from '../helpers/surface-ready.mjs';
import {requestFailure} from '../helpers/network-diagnostics.mjs';

const units=await runtimeUnits();
const route=unit=>`/learn/${unit.grade}/term/${unit.term}/${unit.id}`;
const routes=[
  ...[9,10,11].map(grade=>[`grade ${grade} map`,`/learn/${grade}`]),
  ['deployment offer','/institutions/deploy'],['digitisation offer','/institutions/digitise'],['institution demo','/institutions/demo'],
  ...['cohorts','learners','facilitators','team'].map(section=>[`institution ${section} gate`,`/institutions/manage/${section}`]),
  ...['learners','review','coverage','reports','rubrics'].map(section=>[`facilitator ${section} gate`,`/facilitator/${section}`]),
  ['legacy administrator redirect','/institution-admin'],
  ...[8,9,10,11,12].flatMap(grade=>[1,2,3,4].map(term=>[`reader grade ${grade} term ${term}`,route(units.find(unit=>unit.grade===grade&&unit.term===term&&unit.type==='lesson'))])),
  ...units.filter(unit=>unit.type==='assessment').map(unit=>[`assessment ${unit.id}`,route(unit)]),
  ...[[9,2],[10,46],[11,22],[11,42],[8,72],[10,33]].map(([grade,lesson])=>[`complex controls grade ${grade} lesson ${lesson}`,route(units.find(unit=>unit.grade===grade&&unit.startLesson===lesson&&unit.type==='lesson'))]),
];

async function inspect(page,testInfo,path,label){
  const errors=[],consoleErrors=[],failedRequests=[],httpErrors=[];
  const onError=error=>errors.push(error.message);
  const onConsole=event=>{if(event.type()==='error')consoleErrors.push(event.text());};
  const onFailed=request=>failedRequests.push(requestFailure(request));
  const onResponse=response=>{if(response.status()>=400)httpErrors.push({url:new URL(response.url()).pathname,status:response.status()});};
  page.on('pageerror',onError);page.on('console',onConsole);page.on('requestfailed',onFailed);page.on('response',onResponse);
  try{
    const response=await page.goto(path);
    await surfaceReady(page,path);
    const diagnostics=await page.evaluate(()=>({
      url:location.pathname,viewport:{width:innerWidth,height:innerHeight},rootWidth:document.documentElement.scrollWidth,bodyWidth:document.body.scrollWidth,
      alternativeTargets:[...document.querySelectorAll('.home-alternative-path > summary')].map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),
      headings:[...document.querySelectorAll('h1')].map(el=>el.textContent),mainCount:document.querySelectorAll('main').length,
      fields:[...document.querySelectorAll('input,select,textarea')].filter(el=>el.getClientRects().length&&!el.closest('[inert]')).map(el=>({tag:el.tagName,label:el.getAttribute('aria-label')||el.labels?.[0]?.textContent||el.getAttribute('aria-labelledby')||''})),
      tinyTargets:[...document.querySelectorAll('a,button,input,select,textarea,summary')].filter(el=>!el.closest('[inert]')&&el.getClientRects().length).map(el=>({el,rect:el.getBoundingClientRect()})).filter(({rect})=>rect.width<24||rect.height<24).slice(0,25).map(({el,rect})=>({label:el.getAttribute('aria-label')||el.textContent?.slice(0,90),width:rect.width,height:rect.height})),
    }));
    await testInfo.attach(label+' diagnostics',{body:Buffer.from(JSON.stringify({requested:path,status:response.status(),...diagnostics,errors,consoleErrors,failedRequests,httpErrors},null,2)),contentType:'application/json'});
    await testInfo.attach(label+' screenshot',{body:await page.screenshot({fullPage:true,animations:'disabled'}),contentType:'image/png'});
    expect(response.status()).toBe(200);
    expect(errors).toEqual([]);
    expect(consoleErrors).toEqual([]);
    expect(failedRequests.filter(request=>!request.cancelledPrefetch)).toEqual([]);
    expect(httpErrors).toEqual([]);
    expect(diagnostics.mainCount).toBe(1);
    expect(diagnostics.alternativeTargets.filter(target=>target.width<44||target.height<44)).toEqual([]);
    expect(diagnostics.headings.length).toBe(1);
    expect(diagnostics.fields.filter(field=>!field.label.trim())).toEqual([]);
    expect(diagnostics.rootWidth).toBeLessThanOrEqual(diagnostics.viewport.width+2);
    expect(diagnostics.bodyWidth).toBeLessThanOrEqual(diagnostics.viewport.width+2);
  }finally{
    page.off('pageerror',onError);page.off('console',onConsole);page.off('requestfailed',onFailed);page.off('response',onResponse);
  }
}

for(const [name,path] of routes){
  test(name+' has labelled, responsive content and no browser or network errors',async({page},testInfo)=>{
    await inspect(page,testInfo,path,'light');
  });
}

for(const appearance of ['dark','system']){
  test(appearance+' appearance supports enlarged reading across learner and institution surfaces',async({page},testInfo)=>{
    test.setTimeout(150_000);
    await page.emulateMedia({colorScheme:'dark',reducedMotion:'reduce'});
    await page.addInitScript(appearance=>{
      localStorage.setItem('applied-commerce:personalisation:v1:guest',JSON.stringify({appearance,accent:'commerce',textSize:'extra_large',readingWidth:'narrow'}));
    },appearance);
    for(const path of ['/','/settings','/learn/12',route(units.find(unit=>unit.grade===12&&unit.startLesson===5)),'/portfolio','/progress','/institutions/demo']){
      await inspect(page,testInfo,path,appearance+' '+path.replaceAll('/','-'));
    }
  });
}

test('compact landscape reader keeps navigation and response fields reachable',async({page},testInfo)=>{
  await page.setViewportSize({width:800,height:360});
  await inspect(page,testInfo,route(units.find(unit=>unit.grade===11&&unit.startLesson===22)),'landscape');
  await page.getByRole('button',{name:'Open term map'}).click();
  const dialog=page.getByRole('dialog',{name:'Term map'});
  await expect(dialog).toBeVisible();
  const close=dialog.getByRole('button',{name:'Close term map'});
  await expect(close).toBeInViewport();
  await page.keyboard.press('Escape');
  const field=page.locator('.lesson-document textarea').first();
  await field.fill('Landscape fixture');await field.scrollIntoViewIfNeeded();await expect(field).toBeInViewport();
});

test('invalid destinations offer a safe route back to learning',async({page},testInfo)=>{
  for(const path of ['/learn/7','/learn/8/term/7/missing','/facilitator/unknown','/institutions/manage/unknown','/missing']){
    const response=await page.goto(path);
    await expect(page.getByRole('heading',{name:'That learning page was not found.'})).toBeVisible();
    await expect(page.getByRole('link',{name:'Back to curriculum'})).toHaveAttribute('href','/learn');
    await testInfo.attach('invalid route '+path,{body:Buffer.from(JSON.stringify({requested:path,status:response.status()})),contentType:'application/json'});
  }
  await page.goto('/learn/8/term/1/unknown-unit');
  await expect(page.getByRole('heading',{name:'Lesson unavailable'})).toBeVisible();
  await page.getByRole('button',{name:'Return to grade map'}).click();
  await expect(page).toHaveURL(/\/learn\/8$/);
  await expect(page.locator('.grade-hero h1')).toBeVisible();
});
