import { defineMiddleware } from "astro:middleware";

import { isProduction } from "@/lib/env";

/**
 * Cabeçalhos de segurança e regras por ambiente aplicados a toda resposta.
 * A CSP completa entra na fatia F12; aqui ficam os cabeçalhos que não dependem de nonce.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.requestId = crypto.randomUUID().slice(0, 8);

  const upstream = await next();
  // Respostas de assets podem vir com cabeçalhos imutáveis; recriar garante que podemos anotar.
  const response = new Response(upstream.body, upstream);
  const headers = response.headers;

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "DENY");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()",
  );
  headers.set("X-Request-Id", context.locals.requestId);

  // Fora de produção (desenvolvimento e preview) nada pode ser indexado.
  if (!isProduction()) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
});
