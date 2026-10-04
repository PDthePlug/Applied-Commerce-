import { expect, test } from "@playwright/test";

const fixtures = {
  hierarchy: {
    path: "/learn/8/term/1/g8-t1-l02-002",
    title: "WHERE MY BELIEFS COME FROM",
  },
  tables: {
    path: "/learn/10/term/2/g10-t2-l26-026",
    title: "INVESTMENT VEHICLES — ZINHLE'S PORTFOLIO MAP",
  },
  choice: {
    path: "/learn/11/term/3/g11-t3-l42-042",
    title: "ADVANCED INVESTING — ZINHLE'S RETURN",
  },
  longTitle: {
    path: "/learn/12/term/1/g12-t1-l05-005",
    title: "MYAH'S FIRST BIG DECISION — THE DECISION MATRIX",
  },
  assessment: {
    path: "/learn/9/term/1/g9-t1-assessment-1",
    title: "GRADE 9 TERM 1 MOCK EXAM",
  },
};

async function openFixture(page, fixture) {
  await page.goto(fixture.path, { waitUntil: "domcontentloaded" });
  const heading = page.locator(".lesson-heading h1");
  await expect(heading).toHaveText(fixture.title, { timeout: 20_000 });
  await expect(page.locator(".reader-shell")).toHaveAttribute(
    "data-presentation-contract",
    "applied-commerce-v2",
  );
  await page.evaluate(async () => {
    if (document.fonts?.ready) await document.fonts.ready;
  });
}

async function expectViewportIntegrity(page) {
  const dimensions = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    rootWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  expect(dimensions.rootWidth).toBeLessThanOrEqual(dimensions.innerWidth + 1);
  expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.innerWidth + 1);

  const chrome = await page.evaluate(() => {
    const topbar = document.querySelector(".reader-topbar")?.getBoundingClientRect();
    const progress = document.querySelector(".reader-progress")?.getBoundingClientRect();
    const heading = document.querySelector(".lesson-heading")?.getBoundingClientRect();
    if (!topbar || !progress || !heading) return null;
    return {
      chromeBottom: Math.max(topbar.bottom, progress.bottom),
      headingTop: heading.top,
    };
  });
  expect(chrome).not.toBeNull();
  expect(chrome.headingTop).toBeGreaterThan(chrome.chromeBottom + 8);
}

async function attachEvidence(page, testInfo, name) {
  const image = await page.screenshot({ fullPage: true, animations: "disabled" });
  await testInfo.attach(`${name}-${testInfo.project.name}`, {
    body: image,
    contentType: "image/png",
  });
}

test.describe("Applied Commerce Presentation Architecture 2.0", () => {
  test("hierarchy stays quiet for reading and strong at learning transitions", async ({ page }, testInfo) => {
    await openFixture(page, fixtures.hierarchy);
    await expectViewportIntegrity(page);

    await expect(page.locator(".thinking-equation-notice")).toHaveCount(1);
    expect(await page.locator(".learning-notice").count()).toBeGreaterThanOrEqual(3);
    expect(await page.locator(".response-surface").count()).toBeGreaterThan(0);
    await expect(page.locator(".workbook-panel")).toBeVisible();
    expect(await page.locator(".reader-footer a").count()).toBeGreaterThan(0);

    const bodyCopy = page.locator(".lesson-document p").first();
    const copyStyle = await bodyCopy.evaluate((node) => {
      const style = getComputedStyle(node);
      return { fontSize: parseFloat(style.fontSize), lineHeight: parseFloat(style.lineHeight) };
    });
    expect(copyStyle.fontSize).toBeGreaterThanOrEqual(15);
    expect(copyStyle.lineHeight / copyStyle.fontSize).toBeGreaterThanOrEqual(1.55);

    await attachEvidence(page, testInfo, "hierarchy");
  });

  test("simple tables become labelled mobile rows while wide tables retain geometry", async ({ page }, testInfo) => {
    await openFixture(page, fixtures.tables);
    await expectViewportIntegrity(page);

    expect(await page.locator(".source-table-wrap").count()).toBeGreaterThanOrEqual(3);
    expect(await page.locator(".responsive-row-table").count()).toBeGreaterThan(0);
    expect(await page.locator(".source-table-wrap:not(.responsive-row-table)").count()).toBeGreaterThan(0);

    const width = page.viewportSize()?.width ?? 1280;
    if (width <= 620) {
      const responsiveCell = page.locator(".responsive-row-table tbody td").first();
      const cellStyle = await responsiveCell.evaluate((node) => ({
        display: getComputedStyle(node).display,
        label: getComputedStyle(node, "::before").content,
      }));
      expect(cellStyle.display).toBe("grid");
      expect(cellStyle.label).not.toBe("none");
      expect(cellStyle.label).not.toBe('""');

      const wideWrap = page.locator(".source-table-wrap:not(.responsive-row-table)").first();
      const overflow = await wideWrap.evaluate((node) => getComputedStyle(node).overflowX);
      expect(["auto", "scroll"]).toContain(overflow);
    } else {
      const tableDisplay = await page.locator(".responsive-row-table table").first().evaluate(
        (node) => getComputedStyle(node).display,
      );
      expect(tableDisplay).toBe("table");
    }

    await attachEvidence(page, testInfo, "tables");
  });

  test("authored choices remain usable and visibly selected", async ({ page }, testInfo) => {
    await openFixture(page, fixtures.choice);
    await expectViewportIntegrity(page);

    const option = page.locator(".choice-option").first();
    await expect(option).toBeVisible();
    const before = await option.getAttribute("aria-checked");
    await option.click();
    const after = await option.getAttribute("aria-checked");
    expect(after).not.toBe(before);
    await expect(option.locator("span")).toContainText("✓");

    if ((page.viewportSize()?.width ?? 1280) <= 430) {
      const box = await option.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    await attachEvidence(page, testInfo, "choice");
  });

  test("long lesson titles wrap without colliding with reader chrome", async ({ page }, testInfo) => {
    await openFixture(page, fixtures.longTitle);
    await expectViewportIntegrity(page);

    const metrics = await page.locator(".lesson-heading h1").evaluate((node) => {
      const rect = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      return {
        width: rect.width,
        parentWidth: node.parentElement?.getBoundingClientRect().width ?? 0,
        fontSize: parseFloat(style.fontSize),
        lineHeight: parseFloat(style.lineHeight),
      };
    });
    expect(metrics.width).toBeLessThanOrEqual(metrics.parentWidth + 1);
    expect(metrics.fontSize).toBeGreaterThanOrEqual(34);
    expect(metrics.lineHeight).toBeGreaterThan(metrics.fontSize * 0.9);

    await attachEvidence(page, testInfo, "long-title");
  });

  test("formal assessment answers use assessment surfaces and real controls", async ({ page }, testInfo) => {
    await openFixture(page, fixtures.assessment);
    await expectViewportIntegrity(page);

    expect(await page.locator(".response-surface-assessment").count()).toBeGreaterThan(0);
    expect(await page.locator(".assessment-choice-list").count()).toBeGreaterThan(0);
    const radio = page.locator(".assessment-choice-list input[type=radio]").first();
    const option = page.locator(".assessment-choice-list label").first();
    await expect(radio).toBeAttached();
    await expect(option).toBeVisible();
    await option.click();
    await expect(radio).toBeChecked();

    const selected = page.locator(".assessment-choice-list label.selected").first();
    await expect(selected).toBeVisible();

    await attachEvidence(page, testInfo, "assessment");
  });
});
