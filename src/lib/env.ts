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

/**
 * Só verdadeiro em desenvolvimento local/CI — nunca em preview. Rotas que precisam ser
 * inacessíveis mesmo num preview publicamente alcançável (dev-login, /dev/mailbox: ambos criam ou
 * expõem sessão de usuário sem senha) checam isto, não `!isProduction()` — preview tem
 * `workers_dev: true` no wrangler.jsonc e é tão público quanto produção para esse efeito.
 */
export function isDevelopment(current: Env = getEnv()): boolean {
  return current.ENVIRONMENT === "development";
}

/** Cadastros públicos só abrem com habilitação explícita fora de desenvolvimento. */
export function publicSignupsEnabled(current: Env = getEnv()): boolean {
  const flag = current.PUBLIC_SIGNUPS_ENABLED;
  return flag === undefined ? isDevelopment(current) : flag === "true";
}

/** Comunidade pública depende de habilitação operacional explícita. */
export function communityEnabled(current: Env = getEnv()): boolean {
  const flag = current.COMMUNITY_ENABLED;
  return flag === undefined ? isDevelopment(current) : flag === "true";
}
