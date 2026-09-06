import { defineConfig, devices } from "@playwright/test";

// Portas independentes permitem validar worktrees sem compartilhar servidor ou banco.
const PORT = Number(process.env.E2E_PORT ?? 8788);
if (!Number.isInteger(PORT) || PORT < 1024 || PORT > 65535) {
  throw new Error("E2E_PORT deve ser uma porta entre 1024 e 65535.");
}
const baseURL = `http://127.0.0.1:${PORT}`;
// Ambiente simulado pelo wrangler (`--var`) para exercitar os gates por ambiente. O deploy real
// resolve o ambiente no build (CLOUDFLARE_ENV); aqui só trocamos a variável em cima do build atual.
const environment = process.env.E2E_ENVIRONMENT ?? "development";
// Permite apontar um Chromium já instalado quando `npx playwright install` não é possível.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

// Roda contra o build real servido pelo wrangler (mesmo runtime da produção), não contra o astro dev.
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    reducedMotion: "reduce",
    trace: "retain-on-failure",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [
    {
      // Só requisições HTTP (specs *.api): uma execução basta, sem navegador.
      name: "api",
      testMatch: ["**/*.api.spec.ts"],
    },
    {
      // Navegador em 360 px (isMobile, DPR 3): specs de página e gates de largura.
      name: "celular",
      testMatch: ["e2e/**/*.spec.ts", "gates/**/*.spec.ts"],
      testIgnore: ["**/*.api.spec.ts"],
      use: { ...devices["Galaxy S24"] },
    },
    {
      // Gates sem lógica dependente de viewport (axe, font-size) também rodam aqui; os que só
      // fazem sentido em 360 px (tap-targets, viewport-360) se autoexcluem via `test.skip`.
      name: "desktop",
      testMatch: ["e2e/**/*.spec.ts", "gates/**/*.spec.ts"],
      testIgnore: ["**/*.api.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Sempre sobe um servidor próprio sobre o build atual e o banco recriado. Não reaproveita um
    // `npm run preview` aberto na mesma porta, que poderia servir um build antigo com banco sujo.
    command: `sh scripts/db-reset-local.sh && npx wrangler dev --config dist/server/wrangler.json --persist-to .wrangler/state --port ${PORT} --var ENVIRONMENT:${environment}`,
    // Prontidão pela home: se o banco falhar, o 503 de /api/health aparece como falha de teste
    // explícita em health.api.spec.ts, não como timeout do servidor.
    url: `${baseURL}/`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
