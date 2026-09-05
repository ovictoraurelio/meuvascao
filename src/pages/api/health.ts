import type { APIRoute } from "astro";

import { pingDatabase } from "@/lib/db/client";
import { getEnv } from "@/lib/env";

/**
 * Verificação de saúde: ambiente e acesso ao banco. Sem dados pessoais, sem cache.
 * Usada pelo Playwright para esperar o servidor e pelos ambientes remotos como sonda.
 * Binding ausente ou banco indisponível respondem 503; nunca "ok" sem banco.
 */
export const GET: APIRoute = async ({ locals }) => {
  const env = getEnv();

  let db: "ok" | "error" = "ok";
  try {
    await pingDatabase(env.DB);
  } catch {
    db = "error";
  }

  const ok = db === "ok";
  return Response.json(
    { ok, env: env.ENVIRONMENT, db, requestId: locals.requestId },
    { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
};
