import { fileURLToPath } from "node:url";

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
          // O alias @/ espelha tsconfig.json para módulos importados pelos testes de Node.
          // fileURLToPath evita caminhos percent-encoded (espaços, acentos) e funciona no Windows.
          resolve: {
            alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
          },
          test: {
            name: "unit",
            include: ["tests/unit/**/*.test.ts"],
            environment: "node",
          },
        },
        {
          // Testes em workerd com D1 real e isolado por arquivo de teste. Sem `main`: os testes
          // exercitam bindings e repositórios, não um Worker de entrada.
          plugins: [
            cloudflareTest({
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
