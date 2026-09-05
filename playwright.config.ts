import { defineConfig, devices } from "@playwright/test";

const PORT = 8788;
const baseURL = `http://127.0.0.1:${PORT}`;
const environment = process.env.E2E_ENVIRONMENT ?? "development";

// Roda contra o build real servido pelo wrangler (mesmo runtime da produção), não contra o astro dev.
export default defineConfig({
  testDir: "./tests",
  testMatch: ["e2e/**/*.spec.ts", "gates/**/*.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    reducedMotion: "reduce",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "celular",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 800 } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `sh scripts/db-reset-local.sh && npx wrangler dev --config dist/server/wrangler.json --persist-to .wrangler/state --port ${PORT} --var ENVIRONMENT:${environment}`,
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
