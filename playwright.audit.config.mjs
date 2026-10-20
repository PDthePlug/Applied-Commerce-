import { defineConfig } from "@playwright/test";

// Discovery-only UI matrix; existing playwright.config.mjs remains the CI acceptance suite.
// Run in the local backend mode (never a live learner or production database).
export default defineConfig({
  testDir: "./tests/ui-audit",
  timeout: 60_000,
  expect: { timeout: 12_000 },
  workers: process.env.CI ? 1 : 2,
  retries: 0,
  reporter: [
    ["line"],
    ["html", { outputFolder: "test-results/ui-audit-report", open: "never" }],
    ["json", { outputFile: "test-results/ui-audit-results.json" }],
  ],
  outputDir: "test-results/ui-audit-playwright",
  use: {
    baseURL: "http://127.0.0.1:3100",
    actionTimeout: 10_000,
    navigationTimeout: 25_000,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: process.env.AC_BROWSER_EXECUTABLE
      ? {
          executablePath: process.env.AC_BROWSER_EXECUTABLE,
          args: ["--no-sandbox", "--disable-dev-shm-usage"],
        }
      : undefined,
  },
  webServer: {
    command: "npm run start -- -H 127.0.0.1 -p 3100",
    url: "http://127.0.0.1:3100",
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      NEXT_PUBLIC_APPLIED_COMMERCE_BACKEND_MODE: "local",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    },
  },
  projects: [
    { name: "phone-320", use: { viewport: { width: 320, height: 760 } } },
    { name: "phone-360", use: { viewport: { width: 360, height: 800 } } },
    { name: "phone-430", use: { viewport: { width: 430, height: 932 } } },
    { name: "tablet-768", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop-1280", use: { viewport: { width: 1280, height: 900 } } },
    { name: "desktop-1920", use: { viewport: { width: 1920, height: 1080 } } },
  ],
});
