import { env as workerEnv } from "cloudflare:workers";
import { z } from "zod";

/**
 * Ponto único de acesso ao ambiente do Worker (bindings e variáveis de wrangler.jsonc).
 * `cloudflare:workers` funciona no `astro dev` (workerd via Vite), no `wrangler dev` e em produção.
 */
export function getEnv(): Env {
  return workerEnv as Env;
}

/** Variáveis públicas (não segredos), validadas cedo para falhar com mensagem clara. */
const publicSchema = z.object({
  ENVIRONMENT: z.enum(["development", "preview", "production"]),
  SITE_URL: z.url(),
});

export type PublicEnv = z.infer<typeof publicSchema>;

export function readPublicEnv(env: Env = getEnv()): PublicEnv {
  return publicSchema.parse({
    ENVIRONMENT: env.ENVIRONMENT,
    SITE_URL: env.SITE_URL,
  });
}

export function isProduction(env: Env = getEnv()): boolean {
  return env.ENVIRONMENT === "production";
}
