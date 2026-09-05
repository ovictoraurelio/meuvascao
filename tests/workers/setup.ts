import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

// Cada arquivo de teste começa com o esquema completo aplicado num D1 isolado.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
