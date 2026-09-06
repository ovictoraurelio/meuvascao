import type { APIRoute } from "astro";

import { getRequestDb } from "@/lib/db/client";
import { isDevelopment } from "@/lib/env";
import { safeRedirectTarget } from "@/lib/http/redirect-safe";
import {
  devLogin,
  devLoginSchema,
  ReservedNicknameError,
  setSessionCookie,
} from "@/modules/identidade";

// Só em desenvolvimento local/CI — nunca em preview nem produção (CLAUDE.md #7), verificado em
// runtime, nunca por esquema/rota condicional. Cria sessão com qualquer papel (inclusive
// admin/moderador) sem exigir nada de quem chama; preview tem `workers_dev: true` e é
// publicamente alcançável, então `!isProduction()` sozinho deixaria qualquer visitante do preview
// de uma PR se autenticar como admin. tests/workers/dev-login.test.ts prova o 404 fora de
// desenvolvimento.
export const POST: APIRoute = async (context) => {
  if (!isDevelopment()) {
    return new Response("Not found", { status: 404 });
  }

  const formData = await context.request.formData();
  const parsed = devLoginSchema.safeParse({
    nickname: formData.get("nickname"),
    role: formData.get("role") || undefined,
  });
  if (!parsed.success) {
    return new Response(JSON.stringify(parsed.error.issues), {
      status: 400,
    });
  }

  const db = getRequestDb();
  let sessionCookieValue: string;
  try {
    ({ sessionCookieValue } = await devLogin(db, parsed.data));
  } catch (error) {
    if (error instanceof ReservedNicknameError) {
      return new Response("Apelido reservado.", { status: 400 });
    }
    throw error;
  }
  setSessionCookie(context.cookies, sessionCookieValue);

  const redirectTarget =
    safeRedirectTarget(formData.get("redirect")?.toString()) ?? "/perfil";
  return context.redirect(redirectTarget);
};
