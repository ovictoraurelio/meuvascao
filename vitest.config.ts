import {
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations("./migrations");

  return {
    test: {
      projects: [
        {
          resolve: {
            alias: { "@": new URL("./src", import.meta.url).pathname },
          },
          test: {
            name: "unit",
            include: ["tests/unit/**/*.test.ts"],
            environment: "node",
          },
        },
        {
          // Testes em workerd com D1 real e isolado por arquivo de teste.
          plugins: [
            cloudflareTest({
              main: "./tests/workers/stub-worker.ts",
              wrangler: { configPath: "./tests/workers/wrangler.test.jsonc" },
              miniflare: {
                bindings: { TEST_MIGRATIONS: migrations },
              },
            }),
          ],
          test: {
            name: "workers",
            include: ["tests/workers/**/*.test.ts"],
            setupFiles: ["./tests/workers/setup.ts"],
          },
        },
      ],
    },
  };
});
