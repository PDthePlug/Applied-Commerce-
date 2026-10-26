import {test,expect} from '@playwright/test';
import {runtimeUnits} from '../../scripts/semantic-census.mjs';
const unit=(await runtimeUnits()).find(u=>u.id==='g10-t4-l60-060');
const key=`${unit.id}::prompt-dfe0b8dcfd78fcd81bea25f0-1::choice`;
const storageKey='applied-commerce-learning-state-v1';
const route=`/learn/10/term/4/${unit.id}`;
const group=(page,label)=>page.getByRole('group',{name:`${label}:`,exact:true});

test('horizons edit, clear and reload independently while previous combined work stays recoverable (local)',async({page})=>{
  await page.addInitScript(({storageKey,key})=>{
    if(!localStorage.getItem(storageKey))localStorage.setItem(storageKey,JSON.stringify({version:2,completed:{},responses:{},promptResponses:{[key]:'Dependent\nAbundant 10 years:'}}));
  },{storageKey,key});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(route);
  const horizons=['Now','10 years','20 years','40 years'],options=['Dependent','Stable','Secure','Independent'];
  await expect(page.locator('.horizon-choice')).toHaveCount(4);
  await expect(page.locator('.horizon-options input:checked')).toHaveCount(0);
  await page.locator('.horizon-choices summary').click();
  await expect(page.locator('.horizon-choices details p')).toHaveText('Dependent\nAbundant 10 years:');
  for(let i=0;i<horizons.length;i++)await group(page,horizons[i]).getByRole('radio',{name:options[i],exact:true}).check();
  await expect(page.locator('.horizon-options input:checked')).toHaveCount(4);
  await group(page,'Now').getByRole('radio',{name:'Dependent',exact:true}).focus();
  await page.keyboard.press('ArrowRight');
  await expect(group(page,'Now').getByRole('radio',{name:'Surviving',exact:true})).toBeChecked();
  await page.reload();
  await expect(group(page,'Now').getByRole('radio',{name:'Surviving',exact:true})).toBeChecked();
  for(let i=1;i<horizons.length;i++)await expect(group(page,horizons[i]).getByRole('radio',{name:options[i],exact:true})).toBeChecked();
  await group(page,'10 years').getByRole('button',{name:'Clear 10 years selection',exact:true}).click();
  await page.reload();
  await expect(group(page,'10 years').locator('input:checked')).toHaveCount(0);
  await expect(group(page,'20 years').getByRole('radio',{name:'Secure',exact:true})).toBeChecked();
  const saved=await page.evaluate(({storageKey,key})=>JSON.parse(localStorage.getItem(storageKey)).promptResponses[key],{storageKey,key});
  expect(JSON.parse(saved).legacy).toBe('Dependent\nAbundant 10 years:');
  for(const width of [320,1280]){
    await page.setViewportSize({width,height:900});
    await page.evaluate(()=>document.documentElement.style.setProperty('--ac-text-scale','2'));
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
  await page.emulateMedia({media:'print'});
  await expect(page.locator('.horizon-previous-print')).toBeVisible();
  await expect(page.locator('.horizon-previous-print p')).toHaveText('Dependent\nAbundant 10 years:');
  await expect(page.getByRole('button',{name:'Clear Now selection',exact:true})).toBeHidden();
  await page.emulateMedia({media:'screen'});
  for(const label of ['Now','20 years','40 years'])await group(page,label).getByRole('button',{name:`Clear ${label} selection`,exact:true}).click();
  await page.reload();
  await expect(page.locator('.horizon-options input:checked')).toHaveCount(0);
  const cleared=await page.evaluate(({storageKey,key})=>JSON.parse(localStorage.getItem(storageKey)).promptResponses[key],{storageKey,key});
  expect(cleared).toBe('Dependent\nAbundant 10 years:');
  expect(errors).toEqual([]);
});
