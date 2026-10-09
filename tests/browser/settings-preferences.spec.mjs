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

test("dark and system themes keep the learner menu and settings readable", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

  const theme = async (value) => {
    await page.getByRole("button", { name: /Appearance/ }).click();
    await page.getByLabel("Theme").selectOption(value);
    await expect(page.locator("html")).toHaveAttribute("data-ac-appearance", value);
  };
  const contrast = async (foreground, background) => page.evaluate(({ foreground, background }) => {
    const parse = (value) => {
      const match = value.match(/[\d.]+/g)?.map(Number) ?? [];
      if (match.length < 3) return null;
      const channels = match.slice(0, 3).map(channel => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    }, luminance = (value) => parse(value);
    const a = luminance(foreground), b = luminance(background);
    if (a === null || b === null) return 0;
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, { foreground, background });

  for (const appearance of ["dark", "system"]) {
    await theme(appearance);
    const settingsText = await page.locator(".settings-content").evaluate(el => ({
      color: getComputedStyle(el).color,
      background: getComputedStyle(el).backgroundColor,
    }));
    expect(await contrast(settingsText.color, settingsText.background)).toBeGreaterThanOrEqual(4.5);

    await page.getByRole("button", { name: "Open Applied Commerce menu" }).click();
    const menu = page.locator(".app-menu-sheet");
    await expect(menu).toBeVisible();
    const menuColors = await menu.locator(".app-menu-items a").first().evaluate(el => ({
      color: getComputedStyle(el).color,
      surface: getComputedStyle(el.closest(".app-menu-sheet")).backgroundColor,
    }));
    expect(await contrast(menuColors.color, menuColors.surface)).toBeGreaterThanOrEqual(4.5);
    await page.getByRole("button", { name: "Close menu" }).click();
  }
});

test("all appearance, accent, text size and reading width settings update the document", async ({ page }) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: /Appearance/ }).click();
  const theme = page.getByLabel("Theme");
  for (const value of ["light", "warm", "dark", "system"]) {
    await theme.selectOption(value);
    await expect(page.locator("html")).toHaveAttribute("data-ac-appearance", value);
  }

  for (const accent of ["Commerce", "Blue", "Amber", "Sage"]) {
    await page.getByRole("button", { name: /Appearance/ }).click();
    await page.getByRole("button", { name: accent, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-ac-accent", accent.toLowerCase());
    const activeAccentContrast = await page.locator(".settings-nav button[aria-current='page']").evaluate(el => {
      const luminance = (color) => {
        const channels = (color.match(/[\\d.]+/g) ?? []).slice(0, 3).map(value => {
          const channel = Number(value) / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        });
        return channels.length === 3 ? 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2] : null;
      };
      const foreground = luminance(getComputedStyle(el.querySelector("span")).color);
      const background = luminance(getComputedStyle(el).backgroundColor);
      return foreground === null || background === null ? 0 : (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
    });
    expect(activeAccentContrast).toBeGreaterThanOrEqual(4.5);
  }

  await page.getByRole("button", { name: /Reading/ }).click();
  const textSize = page.getByLabel("Text size");
  for (const value of ["small", "standard", "large", "extra_large"]) {
    await textSize.selectOption(value);
    await expect(page.locator("html")).toHaveAttribute("data-ac-text-size", value);
  }
  const width = page.getByLabel("Reading width");
  for (const value of ["narrow", "standard", "wide"]) {
    await width.selectOption(value);
    await expect(page.locator("html")).toHaveAttribute("data-ac-reading-width", value);
  }
});
