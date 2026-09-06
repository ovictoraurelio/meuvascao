import { fileURLToPath } from "node:url";

import {
  cloudflareTest,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig(async () => {
  const migrations = await readD1Migrations("./migrations");
  // Espelha o `@/*` de tsconfig.json. fileURLToPath evita caminhos percent-encoded (espaços,
  // acentos) e funciona no Windows. Os dois projetos importam módulos de src/ (repositórios,
  // libs) por esse alias, não só os testes de Node.
  const srcAlias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

  return {
    test: {
      projects: [
        {
          resolve: { alias: srcAlias },
          test: {
            name: "unit",
            include: ["tests/unit/**/*.test.ts"],
            environment: "node",
          },
        },
        {
          // Testes em workerd com D1 real e isolado por arquivo de teste. Sem `main`: os testes
          // exercitam bindings e repositórios, não um Worker de entrada.
          resolve: { alias: srcAlias },
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
