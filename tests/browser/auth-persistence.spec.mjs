import { expect, test } from "@playwright/test";
const storageKey = "applied-commerce-learning-state-v1";
test("learner local state survives reload and profile stays concise without altering the record", async ({ page }) => {
  await page.goto("/profile");
  await expect(page.locator(".profile-page")).toBeVisible();
  await page.evaluate((key) => localStorage.setItem(key, JSON.stringify({ version:2, previousResponses:{}, completed:{"g8-u2":"2026-10-08T10:00:00.000Z"}, completedMeta:{"g8-u2":{grade:8,term:1}}, responses:{"g8-u2":"Local recovery certification"}, responseUpdatedAt:{"g8-u2":"2026-10-08T10:00:00.000Z"}, promptResponses:{}, promptResponseUpdatedAt:{}, profile:{displayName:"Certification Learner",grade:8}, activeGrade:8, lastOpened:{grade:8,term:1,unitId:"g8-u2",at:"2026-10-08T10:00:00.000Z"} })), storageKey);
  await page.reload();
  await expect(page.locator(".profile-hero h1")).toHaveText("Certification Learner");
  await expect(page.locator(".profile-record-note")).toContainText("currently stays on this device");
  await expect(page.locator(".profile-card")).toContainText("Learning progress");
  await expect(page.locator(".profile-grid")).not.toContainText("Learning evidence");
  await expect(page.locator(".profile-grid")).not.toContainText("Personal notes");
  await expect(page.locator(".profile-grid")).not.toContainText("Recent activity");
  const persisted = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
  expect(persisted.responses["g8-u2"]).toBe("Local recovery certification");
  expect(persisted.completedMeta["g8-u2"].term).toBe(1);
  await page.goto("/auth");
  const authPanel = page.locator(".auth-panel");
  await expect(authPanel).toBeVisible();
  const emailInput = page.locator('input[type="email"]');
  if (await emailInput.count()) {
    await expect(authPanel).toContainText("Sign in");
    await expect(emailInput).toBeVisible();
  } else {
    await expect(authPanel).toContainText("Account access is temporarily unavailable.");
  }
});
