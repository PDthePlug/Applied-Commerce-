import { expect, test } from "@playwright/test";

async function controlled(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return;
    await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
  });
}

test("manifest, icons and worker headers support installation", async ({ page, request }) => {
  await page.goto("/settings");
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifest = await (await request.get(manifestUrl)).json();
  expect(manifest).toMatchObject({ id: "/", name: "Applied Commerce", start_url: "/", scope: "/", display: "standalone" });
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
    const png = await response.body();
    const size = Number(icon.sizes.split("x")[0]);
    expect(png.readUInt32BE(16)).toBe(size);
    expect(png.readUInt32BE(20)).toBe(size);
  }
  expect(await page.locator('link[rel="apple-touch-icon"]').getAttribute("href")).toBe("/pwa/apple-touch-icon.png");
  expect(await page.locator('link[rel="icon"]').first().getAttribute("href")).toBe("/icon.svg");
  const worker = await request.get("/sw.js");
  expect(worker.headers()["cache-control"]).toContain("no-store");
  expect(worker.headers()["service-worker-allowed"]).toBe("/");
  await controlled(page);
});

test("Profile keeps installation quiet, keyboard accessible and native when available", async ({ page }) => {
  await page.goto("/profile");
  const surface = page.locator(".profile-install");
  const summary = surface.locator(":scope > summary");
  await expect(summary).toHaveText("Install Applied Commerce");
  await expect(surface).not.toHaveAttribute("open", "");
  await expect(surface.getByRole("heading", { name: "A place on your home screen" })).not.toBeVisible();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(surface).toHaveAttribute("open", "");
  await expect(surface.getByRole("heading", { name: "A place on your home screen" })).toBeVisible();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => { window.__installCalls = (window.__installCalls ?? 0) + 1; };
    event.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(event);
  });
  const install = surface.getByRole("button", { name: "Install Applied Commerce", exact: true });
  await expect.poll(async () => {
    const actionBox = await install.boundingBox();
    const menuBox = await page.locator(".app-menu-trigger").boundingBox();
    return actionBox.y + actionBox.height < menuBox.y;
  }).toBe(true);
  await install.click();
  await expect(surface.getByRole("status")).toContainText("You can install later");
  expect(await page.evaluate(() => window.__installCalls)).toBe(1);
  await expect(install).toHaveCount(0);
  await expect(surface.locator(".profile-install-help")).not.toHaveAttribute("open", "");
  await surface.getByText("What works offline?", { exact: true }).click();
  await expect(surface).toContainText("installation does not download the curriculum");
  await expect.poll(async () => {
    const helpBox = await surface.locator(".profile-install-help").boundingBox();
    return helpBox.y + helpBox.height < (await page.locator(".app-menu-trigger").boundingBox()).y;
  }).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(surface).toHaveCount(0);
  await page.goto("/settings");
  await expect(page.getByRole("button", { name: /Install app/ })).toHaveCount(0);
});

for (const device of [
  { name: "iPhone", agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", expected: "Safari", absent: "Chrome" },
  { name: "Android", agent: "Mozilla/5.0 (Linux; Android 13; Pixel 7)", expected: "browser’s menu", absent: "Safari" },
  { name: "desktop", agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", expected: "Chrome", absent: "Safari" },
]) test(`${device.name} installation shows only relevant instructions`, async ({ page }) => {
  await page.addInitScript(agent => {
    Object.defineProperty(navigator, "userAgent", { get: () => agent });
  }, device.agent);
  await page.goto("/profile");
  const surface = page.locator(".profile-install");
  await surface.locator(":scope > summary").click();
  await expect(surface.locator(".profile-install-steps")).toContainText(device.expected);
  await expect(surface.locator(".profile-install-steps")).not.toContainText(device.absent);
  await expect(surface.locator(".profile-install-steps li")).toHaveCount(2);
});

test("a failed native install offers recovery and preserves learner state", async ({ page }) => {
  await page.goto("/profile");
  const surface = page.locator(".profile-install");
  await expect(surface.locator(":scope > summary")).toBeVisible();
  await page.evaluate(() => {
    localStorage.setItem("pwa-test-preserved", "keep my work");
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => { throw new Error("Browser rejected the prompt"); };
    event.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(event);
  });
  await surface.locator(":scope > summary").click();
  await surface.getByRole("button", { name: "Install Applied Commerce" }).click();
  await expect(surface.getByRole("status")).toContainText("Open your browser’s menu");
  await expect(surface.locator(".profile-install-steps")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("pwa-test-preserved"))).toBe("keep my work");
});

test("an installed app does not flash the install action on load", async ({ page }) => {
  await page.addInitScript(() => {
    const original = window.matchMedia.bind(window);
    window.matchMedia = query => {
      if (query !== "(display-mode: standalone)") return original(query);
      return { matches: true, media: query, addEventListener() {}, removeEventListener() {} };
    };
  });
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Learner", exact: true })).toBeVisible();
  await expect(page.locator(".profile-install")).toHaveCount(0);
});

test("profile install remains readable across widths and themes", async ({ page }, info) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/profile");
  const surface = page.locator(".profile-install");
  await surface.locator(":scope > summary").click();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => {};
    event.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(event);
  });
  const widths = info.project.name === "desktop-1280" ? [320, 360, 430, 768, 1280, 1920] : [page.viewportSize().width];
  for (const theme of ["light", "dark", "system"]) {
    await page.evaluate(value => document.documentElement.setAttribute("data-ac-appearance", value), theme);
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${theme}, ${width}px`).toBe(true);
      const button = surface.getByRole("button", { name: "Install Applied Commerce" });
      const box = await button.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
      const contrast = await button.evaluate(el => {
        const luminance = value => {
          const rgb = value.match(/[\d.]+/g).slice(0,3).map(Number).map(x => x/255).map(x => x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
          return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
        };
        const style = getComputedStyle(el), a = luminance(style.color), b = luminance(style.backgroundColor);
        return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
      });
      expect(contrast, `${theme}, ${width}px button contrast`).toBeGreaterThanOrEqual(4.5);
    }
  }
  await page.evaluate(() => document.documentElement.setAttribute("data-ac-appearance", "light"));
  await page.setViewportSize(info.project.use.viewport);
  await page.screenshot({ path: `test-results/pwa-profile-${info.project.name}.png`, fullPage: true });
});

test("an open lesson saves offline, navigation recovers and reconnect restores the answer", async ({ page, context }, info) => {
  const route = "/learn/8/term/1/g8-t1-l01-001";
  await page.goto(route);
  const answer = page.locator(".lesson-document textarea").first();
  await expect(answer).toBeVisible();
  await controlled(page);
  await context.setOffline(true);
  await expect(page.locator(".pwa-offline-notice")).toBeVisible();
  await answer.fill("My PWA answer saved while offline.");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("applied-commerce-learning-state-v1"))).toContain("My PWA answer saved while offline.");
  await page.screenshot({ path: `test-results/pwa-open-lesson-${info.project.name}.png`, fullPage: false });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Let’s get you reconnected." })).toBeVisible();
  await expect.poll(() => page.getByRole("img", { name: "Applied Commerce" }).evaluate(img => img.naturalWidth)).toBe(192);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/pwa-offline-${info.project.name}.png`, fullPage: true });
  await context.setOffline(false);
  await page.getByRole("link", { name: "Try this page again" }).click();
  await expect(page.locator(".lesson-document textarea").first()).toHaveValue("My PWA answer saved while offline.");
  await expect(page.locator(".pwa-offline-notice")).toHaveCount(0);
  const cached = await page.evaluate(async () => {
    const names = (await caches.keys()).filter(name => name.startsWith("applied-commerce-pwa-"));
    return (await Promise.all(names.map(async name => (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname)))).flat();
  });
  expect(cached.sort()).toEqual(["/offline.html", "/pwa/apple-touch-icon.png", "/pwa/icon-192.png", "/pwa/icon-512.png", "/pwa/icon-maskable-512.png"].sort());
});
