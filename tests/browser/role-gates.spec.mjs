import { expect, test } from "@playwright/test";

test.describe("Role-gated workspaces", () => {
  test("facilitator workspace does not expose tools to a signed-out visitor", async ({ page }) => {
    await page.goto("/facilitator", { waitUntil: "domcontentloaded" });

    await expect(page.locator(".institution-admin-page")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sign in to continue." })).toBeVisible();
    await expect(page.getByText(/Facilitator access is granted through an institution or cohort assignment/i)).toBeVisible();
    await expect(page.getByText(/Review learner evidence, apply rubrics/i)).toHaveCount(0);
  });

  test("institution operations does not grant management access to a signed-out visitor", async ({ page }) => {
    await page.goto("/institutions/manage", { waitUntil: "domcontentloaded" });

    await expect(page.locator(".institution-admin-page")).toBeVisible();
    await expect(page.locator(".institution-admin-hero h1")).toContainText("Set up the delivery layer");
    await expect(page.getByRole("link", { name: /Sign in to continue/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Create institution/i })).toHaveCount(0);
  });
});
