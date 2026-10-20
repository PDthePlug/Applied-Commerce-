import { test, expect } from "@playwright/test";
import { surfaceReady } from "../helpers/surface-ready.mjs";
import {requestFailure} from "../helpers/network-diagnostics.mjs";

// Public/local-mode and safely gated shells only. Authenticated facilitator and
// school-admin workflows are intentionally covered separately with isolated fixtures.
const pages = [
  ["home", "/"],
  ["grade library", "/learn"],
  ["grade 8 map", "/learn/8"],
  ["grade 12 map", "/learn/12"],
  ["progress", "/progress"],
  ["portfolio", "/portfolio"],
  ["profile", "/profile"],
  ["settings", "/settings"],
  ["sign in", "/auth"],
  ["reset access", "/auth/reset"],
  ["institutions", "/institutions"],
  ["institution operations gate", "/institutions/manage"],
  ["facilitator gate", "/facilitator"],
  ["classroom guidance gate", "/facilitator/classroom"],
];

for (const [name, url] of pages) {
  test(name + " has stable shell, diagnostics and screenshots", async ({ page }, testInfo) => {
    const pageErrors = [];
    const consoleErrors = [];
    const failedRequests = [];
    const httpErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    page.on("console", event => {
      if (event.type() === "error") consoleErrors.push(event.text());
    });
    page.on("requestfailed", request => failedRequests.push(requestFailure(request)));
    page.on("response", response => { if(response.status()>=400)httpErrors.push({url:response.url(),status:response.status()}); });

    const response = await page.goto(url, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    await surfaceReady(page,url);

    const diagnostics = await page.evaluate(() => {
      const elements = [...document.querySelectorAll("button, a, input, select, textarea")];
      const visible = element => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      };
      const unlabeledButtons = elements
        .filter(element => element.tagName === "BUTTON" && visible(element))
        .filter(element => !(
          element.textContent?.trim() ||
          element.getAttribute("aria-label")?.trim() ||
          element.getAttribute("aria-labelledby")?.trim() ||
          element.getAttribute("title")?.trim() ||
          element.querySelector("img[alt]:not([alt=''])")
        ))
        .map(element => element.outerHTML.slice(0, 180)).slice(0, 20);
      const unnamedFields = elements
        .filter(element => ["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName) && visible(element))
        .filter(element => !(
          element.labels?.length ||
          element.getAttribute("aria-label")?.trim() ||
          element.getAttribute("aria-labelledby")?.trim() ||
          element.getAttribute("title")?.trim()
        ))
        .map(element => element.outerHTML.slice(0, 180)).slice(0, 20);
      const tinyTargets = elements.filter(visible)
        .map(element => ({ element, rect: element.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width < 24 || rect.height < 24)
        .slice(0, 20)
        .map(({ element, rect }) => ({
          element: element.outerHTML.slice(0, 120),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        }));
      return {
        title: document.title,
        url: location.pathname,
        viewport: { width: innerWidth, height: innerHeight },
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        headings: [...document.querySelectorAll("h1")].map(node => node.textContent?.trim()).filter(Boolean),
        mainCount: document.querySelectorAll("main").length,
        unlabeledButtons,
        unnamedFields,
        tinyTargets,
      };
    });

    await testInfo.attach("route-diagnostics", {
      body: Buffer.from(JSON.stringify({
        requested: url,
        status: response?.status(),
        ...diagnostics,
        consoleErrors,
        pageErrors,
        failedRequests,
        httpErrors,
      }, null, 2)),
      contentType: "application/json",
    });
    await testInfo.attach("screen", {
      body: await page.screenshot({ fullPage: true, animations: "disabled", timeout: 30_000 }),
      contentType: "image/png",
    });

    expect(response?.status(), "route should not return a server error").toBeLessThan(500);
    expect(pageErrors, "unexpected browser runtime exceptions").toEqual([]);
    expect(consoleErrors, "unexpected browser console errors").toEqual([]);
    expect(failedRequests.filter(request=>!request.cancelledPrefetch), "failed requests excluding identified speculative cancellations").toEqual([]);
    expect(httpErrors, "HTTP errors").toEqual([]);
    expect(diagnostics.mainCount).toBe(1);
    expect(diagnostics.headings).toHaveLength(1);
    expect(diagnostics.unnamedFields).toEqual([]);
    expect(diagnostics.unlabeledButtons).toEqual([]);
    expect(diagnostics.scrollWidth, "horizontal page overflow at " + diagnostics.viewport.width + "px")
      .toBeLessThanOrEqual(diagnostics.viewport.width + 2);
    expect(diagnostics.bodyScrollWidth, "body overflow at " + diagnostics.viewport.width + "px")
      .toBeLessThanOrEqual(diagnostics.viewport.width + 2);
  });
}

test("keyboard Tab exposes a focusable control on home", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.keyboard.press("Tab");
  const focus = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    visible: !!document.activeElement && document.activeElement !== document.body &&
      !!document.activeElement.getClientRects().length,
  }));
  expect(focus.visible, "first keyboard Tab should reach a visible interactive element").toBe(true);
});
