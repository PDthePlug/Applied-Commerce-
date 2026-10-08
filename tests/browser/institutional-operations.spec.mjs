import { expect, test } from "@playwright/test";

test.describe("Institutional operations", () => {
  test("operations route is present and safely gates unauthenticated access", async ({ page }) => {
    await page.goto("/institutions/manage", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".institution-admin-page")).toBeVisible();
    await expect(page.locator(".institution-admin-hero h1")).toContainText("Set up the delivery layer");
    await expect(page.locator(".institutional-primary")).toContainText("Sign in to continue");

    const dimensions = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      bodyWidth: document.body.scrollWidth,
      rootWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.bodyWidth).toBeLessThanOrEqual(dimensions.innerWidth + 1);
    expect(dimensions.rootWidth).toBeLessThanOrEqual(dimensions.innerWidth + 1);
  });

  test("public institution page exposes the live operations entry point", async ({ page }) => {
    await page.goto("/institutions", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /Open institution operations/i })).toBeVisible();
  });
});
