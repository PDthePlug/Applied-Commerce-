import { expect, test } from "@playwright/test";

test("appearance and reading preferences apply immediately and survive reload", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  await page.getByRole("button", { name: /Appearance/ }).click();
  const theme = page.getByLabel("Theme");
  await expect(theme).toBeEnabled();
  await theme.selectOption("warm");
  await expect(page.locator("html")).toHaveAttribute("data-ac-appearance", "warm");

  await page.getByRole("button", { name: /Reading/ }).click();
  const textSize = page.getByLabel("Text size");
  await expect(textSize).toBeEnabled();
  await textSize.selectOption("large");
  await expect(page.locator("html")).toHaveAttribute("data-ac-text-size", "large");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-ac-appearance", "warm");
  await expect(page.locator("html")).toHaveAttribute("data-ac-text-size", "large");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("applied-commerce:personalisation:v1:guest") || "{}"));
  expect(saved.appearance).toBe("warm");
  expect(saved.textSize).toBe("large");
});
