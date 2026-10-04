import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 45_000,
  expect: { timeout: 12_000 },
  workers: process.env.CI ? 1 : undefined,
  retries: process.env.CI ? 1 : 0,
  reporter: [["line"]],
  outputDir: "test-results/playwright",
  use: {
    baseURL: "http://127.0.0.1:3100",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- -H 127.0.0.1 -p 3100",
    url: "http://127.0.0.1:3100",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 900 } } },
    { name: "mobile-430", use: { viewport: { width: 430, height: 932 } } },
    { name: "mobile-360", use: { viewport: { width: 360, height: 800 } } },
  ],
});
