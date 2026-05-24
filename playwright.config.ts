import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 1,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3099",
    channel: "chromium",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH ?? undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3099",
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
