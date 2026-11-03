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

test("install controls offer browser guidance, handle dismissal and hide when installed", async ({ page }, info) => {
  await page.goto("/settings");
  await page.getByRole("button", { name: /Install app/ }).click();
  await expect(page.getByRole("heading", { name: "Install Applied Commerce", exact: true })).toBeVisible();
  await expect(page.locator(".settings-content")).toContainText("Safari");
  await expect(page.locator(".settings-content")).toContainText("does not download the curriculum");
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    event.prompt = async () => {};
    event.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(event);
  });
  await page.getByRole("button", { name: "Install Applied Commerce", exact: true }).click();
  await expect(page.locator(".settings-content")).toContainText("You can install later");
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(page.locator(".settings-content")).toContainText("running as an installed app");
  await expect(page.getByRole("button", { name: "Install Applied Commerce", exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (info.project.name === "desktop-1280") {
    for (const width of [320, 360, 430, 768, 1280, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `settings at ${width}px`).toBe(true);
      await page.getByRole("button", { name: "Open Applied Commerce menu" }).click();
      await expect(page.getByRole("link", { name: /Settings Install app/ })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `menu at ${width}px`).toBe(true);
      await page.getByRole("button", { name: "Close menu", exact: true }).click();
    }
  }
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
