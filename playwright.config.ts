import { defineConfig, devices } from "@playwright/test";

/** End-to-end tests run against the production build, served by the Workers runtime. */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:4322",
    // Locally, an already-installed Chromium can be reused instead of downloading one.
    launchOptions: process.env.CHROME ? { executablePath: process.env.CHROME } : {},
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "npm run preview -- --port 4322",
    url: "http://localhost:4322",
    reuseExistingServer: !process.env.CI,
  },
});
