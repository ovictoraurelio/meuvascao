import { defineMiddleware } from "astro:middleware";

import { isProduction } from "@/lib/env";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from "@/modules/identidade";

/**
 * Cabeçalhos de segurança e regras por ambiente aplicados a toda resposta gerada pelo Worker.
 * Assets estáticos são servidos antes do Worker e não passam por aqui; para eles valem
 * `public/_headers` (fatia F12) e a meta robots nas páginas.
 * A CSP completa entra na fatia F12; aqui ficam os cabeçalhos que não dependem de nonce.
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Em produção a Cloudflare já identifica a requisição pelo cf-ray; localmente geramos um.
  context.locals.requestId =
    context.request.headers.get("cf-ray") ?? crypto.randomUUID();

  // Só verifica a assinatura e a expiração (sem nenhuma leitura de D1) — uma escrita ou /perfil
  // que precise confirmar que a sessão não foi revogada consulta o banco por conta própria
  // (getAuthenticatedUser em @/modules/identidade). Sem cookie, isto nunca toca o banco.
  context.locals.session = await verifySessionCookieValue(
    context.cookies.get(SESSION_COOKIE_NAME)?.value,
  );

  const upstream = await next();
  // Respostas podem vir com cabeçalhos imutáveis; recriar garante que podemos anotar.
  const response = new Response(upstream.body, upstream);
  const headers = response.headers;

  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Frame-Options", "DENY");
  headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  headers.set("X-Request-Id", context.locals.requestId);

  // Fora de produção (desenvolvimento e preview) nada pode ser indexado.
  if (!isProduction()) {
    headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
});
