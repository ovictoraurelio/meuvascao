import type { APIRoute } from "astro";

import { getEnv, readPublicEnv } from "@/lib/env";

type DbState = "ok" | "error" | "unbound";

/**
 * Verificação de saúde: ambiente e acesso ao banco. Sem dados pessoais, sem cache.
 * Usada pelo Playwright para esperar o servidor e pelos ambientes remotos como sonda.
 */
export const GET: APIRoute = async ({ locals }) => {
  const env = getEnv();
  const publicEnv = readPublicEnv(env);

  let db: DbState = "unbound";
  if (typeof env.DB?.prepare === "function") {
    try {
      await env.DB.prepare("SELECT 1").first();
      db = "ok";
    } catch {
      db = "error";
    }
  }

  const ok = db === "ok";
  return new Response(
    JSON.stringify({
      ok,
      env: publicEnv.ENVIRONMENT,
      db,
      requestId: locals.requestId,
    }),
    {
      status: ok ? 200 : 503,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
};
