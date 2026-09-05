import { applyD1Migrations, type D1Migration } from "cloudflare:test";
import { env } from "cloudflare:workers";

// O pool injeta as migrações lidas de ./migrations como binding só neste ambiente de teste;
// o cast local evita augmentar o tipo global `Env`, que vale também para o código do app.
const { TEST_MIGRATIONS } = env as unknown as {
  TEST_MIGRATIONS: D1Migration[];
};

// Cada arquivo de teste começa com o esquema completo aplicado num D1 isolado.
await applyD1Migrations(env.DB, TEST_MIGRATIONS);
