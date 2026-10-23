import { expect, test } from "@playwright/test";
import { runtimeUnits } from "../../scripts/semantic-census.mjs";

const units=await runtimeUnits();
const storageKey="applied-commerce-learning-state-v1";
const lesson=(grade,number)=>units.find(unit=>unit.type==="lesson"&&unit.grade===grade&&unit.startLesson===number);
const route=unit=>`/learn/${unit.grade}/term/${unit.term}/${unit.id}`;
const checkpoint=page=>page.locator(".learning-section.learning-mode-prove").first();

test("checkpoint numbering is continuous and existing split answers retain their keys",async({page},info)=>{
  const unit=lesson(8,8);
  const key=slot=>`${unit.id}::prompt-${unit.blocks[40].id}::${slot}`;
  const oldAnswers={[key("response-0")]:"Mobile data.",[key("response-1")]:"Schoolwork needs data; entertainment can wait.",[key("response")]:"My earlier combined response."};
  await page.addInitScript(({storageKey,oldAnswers})=>{
    if(!localStorage.getItem(storageKey)) localStorage.setItem(storageKey,JSON.stringify({version:2,completed:{},responses:{},promptResponses:oldAnswers}));
  },{storageKey,oldAnswers});
  const errors=[];page.on("pageerror",error=>errors.push(error.message));
  await page.goto(route(unit));
  await expect(checkpoint(page).locator(".structured-part-label").first()).toHaveText("1.");
  const labels=await checkpoint(page).locator(".structured-part-label").allTextContents();
  expect(labels.length).toBeGreaterThan(6);
  expect(labels).toEqual(labels.map((_,i)=>`${i+1}.`));
  expect(await checkpoint(page).locator(".structured-part-label").first().evaluate(node=>parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(14);
  await expect(checkpoint(page).locator(".structured-response-heading>strong")).toHaveCount(0);
  await expect(page.getByText(/^Part \d+ of \d+$/)).toHaveCount(0);
  await expect(page.getByText("Type your response",{exact:true})).toHaveCount(0);
  const first=checkpoint(page).getByRole("textbox",{name:"Choose one item from your list.",exact:true});
  const second=checkpoint(page).getByRole("textbox",{name:"Explain why it could be both a need and a want.",exact:true});
  await expect(first).toHaveValue(oldAnswers[key("response-0")]);
  await expect(second).toHaveValue(oldAnswers[key("response-1")]);
  const previous=checkpoint(page).getByText("My earlier combined response.",{exact:true});
  await checkpoint(page).getByText("Previous combined response",{exact:true}).click();
  await expect(previous).toBeVisible();
  await first.fill("A school trip.");
  await page.reload();
  await expect(checkpoint(page).getByRole("textbox",{name:"Choose one item from your list.",exact:true})).toHaveValue("A school trip.");
  await expect(checkpoint(page).getByRole("textbox",{name:"Explain why it could be both a need and a want.",exact:true})).toHaveValue(oldAnswers[key("response-1")]);
  const saved=await page.evaluate(storageKey=>JSON.parse(localStorage.getItem(storageKey)).promptResponses,storageKey);
  expect(saved[key("response-0")]).toBe("A school trip.");
  expect(saved[key("response")]).toBe(oldAnswers[key("response")]);
  expect(Object.keys(saved).some(key=>key.includes("::block-"))).toBe(false);
  expect(await checkpoint(page).locator(".structured-part-label").allTextContents()).toEqual(labels);
  await checkpoint(page).locator(".structured-part-label").first().evaluate(node=>node.scrollIntoView({block:"center",behavior:"instant"}));
  await expect(checkpoint(page).locator(".structured-part-label").first()).toBeInViewport();
  await page.screenshot({path:`test-results/checkpoint-numbering-${info.project.name}.png`});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  expect(errors).toEqual([]);
});

test("empty response fields use their placeholder without a repeated caption",async({page},info)=>{
  await page.goto(route(lesson(8,1)));
  const answer=page.getByRole("textbox",{name:"What do you wonder about?",exact:true});
  await expect(answer).toBeVisible();
  await expect(answer).toHaveAttribute("placeholder","Write your response here…");
  await expect(page.getByText("Type your response",{exact:true})).toHaveCount(0);
  await expect(page.locator(".response-status")).toHaveCount(0);
  await answer.fill("How do shops decide their prices?");
  await expect(page.locator(".prompt-response-control").filter({has:answer}).locator(".response-status.saved")).toHaveText("Captured");
  await page.reload();
  const reopened=page.getByRole("textbox",{name:"What do you wonder about?",exact:true});
  await expect(reopened).toHaveValue("How do shops decide their prices?");
  await reopened.fill("");
  await expect(page.locator(".response-status")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("textbox",{name:"What do you wonder about?",exact:true})).toHaveValue("");
  await expect(page.locator(".numbered-response")).toHaveCount(3);
  await page.locator(".numbered-response").first().evaluate(node=>node.scrollIntoView({block:"center",behavior:"instant"}));
  await expect(page.locator(".numbered-response").first()).toBeInViewport();
  await page.screenshot({path:`test-results/response-captions-${info.project.name}.png`});
});

test("each grade starts its checkpoint numbering at one without repeated part labels",async({page})=>{
  for(const grade of [8,9,10,11,12]){
    await page.goto(route(lesson(grade,1)));
    await expect(checkpoint(page).locator(".structured-part-label").first()).toHaveText("1.");
    const labels=await checkpoint(page).locator(".structured-part-label").allTextContents();
    expect(labels).toEqual(labels.map((_,i)=>`${i+1}.`));
    await expect(page.getByText(/^Part \d+ of \d+$/)).toHaveCount(0);
    await expect(page.getByText("Type your response",{exact:true})).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  }
});
