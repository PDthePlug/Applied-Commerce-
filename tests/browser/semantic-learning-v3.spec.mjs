import { mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { runtimeUnits } from "../../scripts/semantic-census.mjs";

const units=await runtimeUnits();
const lesson=(grade,number)=>units.find(unit=>unit.grade===grade&&unit.startLesson===number&&unit.type==="lesson");
const route=unit=>`/learn/${unit.grade}/term/${unit.term}/${unit.id}`;
const storageKey="applied-commerce-learning-state-v1";

async function open(page,unit){
  await page.goto(route(unit));
  await expect(page.locator(".lesson-heading h1")).toHaveText(unit.title);
  await expect(page.locator("[data-semantic-renderer]")).toHaveAttribute("data-semantic-renderer","applied-commerce-v3");
  await page.evaluate(async()=>{await document.fonts.ready;});
}
async function integrity(page){
  const metrics=await page.evaluate(()=>({viewport:innerWidth,root:document.documentElement.scrollWidth,body:document.body.scrollWidth}));
  expect(metrics.root).toBeLessThanOrEqual(metrics.viewport+1);
  expect(metrics.body).toBeLessThanOrEqual(metrics.viewport+1);
  const menu=await page.locator(".app-menu-trigger").boundingBox();
  const header=await page.locator(".reader-topbar").boundingBox();
  expect(menu.y+menu.height).toBeLessThanOrEqual(header.y+header.height);
}
async function evidence(page,testInfo,label){
  const dir="test-results/semantic-v3";
  await mkdir(dir,{recursive:true});
  const path=`${dir}/${label}-${testInfo.project.name}.png`;
  await page.screenshot({path,fullPage:true,animations:"disabled"});
  await testInfo.attach(label,{path,contentType:"image/png"});
}

test("rankings are ordered, confirmed, persistent and visible in portfolio",async({page},info)=>{
  const unit=lesson(10,46);
  await open(page,unit);
  const ranking=page.locator(".ranking-control");
  await expect(ranking.locator("li")).toHaveCount(8);
  await expect(page.locator('.ranking-instruction textarea')).toHaveCount(0);
  await ranking.getByRole("button",{name:"Move Funeral cover up",exact:true}).click();
  await expect(ranking.locator("li").first()).toContainText("Funeral cover");
  await ranking.getByRole("button",{name:"Save this order",exact:true}).click();
  await expect(ranking.locator(".response-status")).toHaveText("Order captured on this device");
  await page.reload();
  await expect(page.locator(".ranking-control li").first()).toContainText("Funeral cover");
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).promptResponses,storageKey);
  const key=`${unit.id}::prompt-${unit.blocks[24].id}::choice`;
  expect(saved[key].split("\n")[0]).toBe("Funeral cover");
  expect(saved[key].split("\n")).toHaveLength(8);
  await integrity(page);await evidence(page,info,"insurance-ranking");
  await page.goto("/portfolio");
  await expect(page.locator(".portfolio-evidence").filter({hasText:"Funeral cover"}).first()).toBeVisible();
});

test("rating controls retain their scale and written action fields",async({page},info)=>{
  await open(page,lesson(11,22));
  const first=page.locator(".rating-control").first();
  await expect(first.locator("button")).toHaveCount(5);
  await first.locator("button").nth(3).click();
  await expect(first.locator("button").nth(3)).toHaveAttribute("aria-pressed","true");
  const action=page.locator('.workbook-table textarea[aria-label="Self-awareness — One Action This Week"]');
  await action.fill("Review my spending each evening.");
  await page.reload();
  await expect(page.locator(".rating-control").first().locator("button").nth(3)).toHaveAttribute("aria-pressed","true");
  await expect(page.locator('.workbook-table textarea[aria-label="Self-awareness — One Action This Week"]')).toHaveValue("Review my spending each evening.");
  await integrity(page);await evidence(page,info,"self-leadership-rating");
});

test("values sort supports authored choices, custom values and five-three-one narrowing",async({page},info)=>{
  await open(page,lesson(9,2));
  const steps=page.locator(".values-control");
  await expect(steps).toHaveCount(3);
  for(const value of ["Family","Security","Justice","Learning"])await steps.nth(0).getByRole("button",{name:value,exact:true}).click();
  await steps.nth(0).getByRole("textbox",{name:"Add a value of your own"}).fill("Kindness");
  await steps.nth(0).getByRole("button",{name:"Add",exact:true}).click();
  await expect(steps.nth(0).locator(".selection-count")).toContainText("5 of 5");
  await expect(steps.nth(0).getByRole("button",{name:"Freedom",exact:true})).toBeDisabled();
  for(const value of ["Family","Justice","Kindness"])await steps.nth(1).getByRole("button",{name:value,exact:true}).click();
  await steps.nth(2).getByRole("button",{name:"Kindness",exact:true}).click();
  await page.reload();
  await expect(page.locator(".values-control").nth(2).getByRole("button",{name:"Kindness",exact:true})).toHaveAttribute("aria-pressed","true");
  await integrity(page);await evidence(page,info,"values-narrowing");
});

test("choices inside source lists remain interactive and keep stable identities",async({page},info)=>{
  await open(page,lesson(8,72));
  const yes=page.getByRole("radiogroup",{name:"Have I done the interview?",exact:true}).first().getByRole("radio",{name:"Yes",exact:true});
  await yes.click();await expect(yes).toHaveAttribute("aria-checked","true");
  await page.reload();
  await expect(page.getByRole("radiogroup",{name:"Have I done the interview?",exact:true}).first().getByRole("radio",{name:"Yes",exact:true})).toHaveAttribute("aria-checked","true");
  await integrity(page);await evidence(page,info,"list-choice");
});

test("equations and percentage fields retain meaning and outline avoids fixed chrome",async({page},info)=>{
  await open(page,lesson(11,42));
  await expect(page.locator(".thinking-equation-notice")).toContainText("Portfolio = Asset Allocation + Rebalancing + Discipline");
  const percentage=page.locator('.inline-blank-cell input[aria-label]').first();
  await percentage.fill("60");
  await page.reload();
  await expect(page.locator('.inline-blank-cell input[aria-label]').first()).toHaveValue("60");
  const link=page.locator(".lesson-outline a").filter({hasText:"Activity 42"});
  await link.click();
  const target=await link.getAttribute("href");
  const targetY=await page.locator(target).evaluate(node=>node.getBoundingClientRect().top);
  const chromeBottom=await page.locator(".reader-topbar").evaluate(node=>node.getBoundingClientRect().bottom);
  expect(targetY).toBeGreaterThan(chromeBottom);
  await integrity(page);await evidence(page,info,"portfolio-equation");
});

test("failed device save does not present an answer as captured",async({page})=>{
  await open(page,lesson(11,22));
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException("Quota exceeded","QuotaExceededError");};});
  await page.locator(".rating-control").first().locator("button").nth(2).click();
  await expect(page.locator(".save-error[role=alert]")).toContainText("could not be saved");
  await expect(page.locator(".rating-control").first().locator("button").nth(2)).toHaveAttribute("aria-pressed","false");
  await expect(page.getByRole("button",{name:"Complete and continue",exact:true})).toBeDisabled();
});

test("completion saves the lesson before moving forward",async({page})=>{
  const unit=lesson(8,2),next=lesson(8,3);
  await open(page,unit);
  await page.getByRole("button",{name:"Complete and continue",exact:true}).click();
  await expect(page).toHaveURL(new RegExp(`${next.id}$`));
  const completed=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).completed,storageKey);
  expect(completed[unit.id]).toBeTruthy();
});

for(const grade of [8,9,10,11,12])for(const term of [1,2,3,4]){
  test(`semantic census Grade ${grade} Term ${term} retains authored content and viewport integrity`,async({page},info)=>{
    const unit=units.find(unit=>unit.grade===grade&&unit.term===term&&unit.type==="lesson");
    const errors=[];page.on("pageerror",error=>errors.push(error.message));
    await open(page,unit);await integrity(page);
    expect(await page.locator(".learning-section").count()).toBeGreaterThan(0);
    expect(await page.locator(".learning-section[data-learning-mode=understand]").count()).toBeGreaterThan(0);
    const narrative=unit.blocks.find(block=>block.kind==="text"&&block.type==="paragraph"&&block.text.length>180);
    if(narrative)await expect(page.locator(".semantic-learning-document")).toContainText(narrative.text);
    expect(errors).toEqual([]);
    await evidence(page,info,`g${grade}-t${term}`);
  });
}
