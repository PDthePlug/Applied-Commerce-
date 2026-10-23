import { expect, test } from "@playwright/test";

for(const grade of [8,9,10,11,12]){
  test(`Grade ${grade} restores original learning symbols and keeps answers on reload`,async({page},testInfo)=>{
    const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    await page.goto(`/learn/${grade}/term/1/g${grade}-t1-l01-001`);
    await expect(page.locator(".lesson-heading h1")).toBeVisible();
    const outcome=page.locator(".learning-outcomes-intro");
    await expect(outcome).toHaveCount(1);
    await expect(outcome.locator("[data-outcome-icons]")).toBeVisible();
    await expect(outcome).toContainText("By the end of this lesson, you will be able to:");
    for(const name of ["read","activity","reflection","checkpoint","home","portfolio","equation"]){
      await expect(page.locator(`.lesson-document [data-lesson-icon="${name}"]`).filter({visible:true}).first()).toBeVisible();
    }
    const key=page.locator(".lesson-icon-key");
    await key.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(key).toHaveAttribute("open","");
    await expect(key.locator("dt")).toHaveCount(7);
    await expect(key.locator("li")).toHaveCount(6);
    await page.keyboard.press("Enter");
    await expect(key).not.toHaveAttribute("open");
    const answer=page.locator(".lesson-document textarea").first();
    await answer.fill("My learning still belongs to this question.");
    await page.reload();
    await expect(page.locator(".lesson-document textarea").first()).toHaveValue("My learning still belongs to this question.");
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
    expect(errors).toEqual([]);
    if(grade===8) await page.screenshot({path:`test-results/lesson-icons-${testInfo.project.name}.png`,fullPage:true});
  });
}

test("Grade 8 Lesson 2 restores the omitted outcome icons at the source introduction",async({page},testInfo)=>{
  await page.goto("/learn/8/term/1/g8-t1-l02-002");
  const outcome=page.locator(".learning-outcomes-intro");
  await expect(outcome.locator(".lesson-symbol")).toHaveText(["🔍","💡","🛠️"]);
  await expect(outcome.locator("[data-outcome-icons]")).toHaveAttribute("aria-hidden","true");
  await outcome.evaluate(element=>element.scrollIntoView({block:"center"}));
  await expect(outcome).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1)).toBe(true);
  await page.screenshot({path:`test-results/outcome-icons-${testInfo.project.name}.png`});
});
