import { env } from "cloudflare:workers";

/**
 * Ponto único de acesso ao ambiente do Worker (bindings e variáveis de wrangler.jsonc).
 * `cloudflare:workers` funciona no `astro dev` (workerd via Vite), no `wrangler dev` e em produção.
 * Os tipos de `Env` são gerados por `wrangler types` a partir do próprio wrangler.jsonc, então
 * `ENVIRONMENT` e `SITE_URL` já chegam como uniões literais; não há o que validar em runtime aqui.
 * Segredos (fatia F6) serão validados na leitura, onde o tipo gerado não garante nada.
 */
export function getEnv(): Env {
  return env;
}

export function isProduction(current: Env = getEnv()): boolean {
  return current.ENVIRONMENT === "production";
}
