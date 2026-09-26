// Browser tests: real rendering, geometry, themes, JS behaviour and
// accessibility for every example and recipe page.
//   npm run test:e2e                      all projects
//   npx playwright test --project=chromium
import { defineConfig, devices } from "@playwright/test";

const PORT = 4799;

export default defineConfig({
  testDir: "test/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: "node scripts/dev.mjs",
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}/examples/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
