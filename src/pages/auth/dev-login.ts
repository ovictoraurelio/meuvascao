import type { APIRoute } from "astro";

import { getRequestDb } from "@/lib/db/client";
import { isProduction } from "@/lib/env";
import { safeRedirectTarget } from "@/lib/http/redirect-safe";
import {
  devLogin,
  devLoginSchema,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from "@/modules/identidade";

// Só fora de produção — verificado em runtime por ENVIRONMENT (CLAUDE.md #7), nunca por
// esquema/rota condicional. tests/workers/dev-login.test.ts prova o 404 em produção.
export const POST: APIRoute = async (context) => {
  if (isProduction()) {
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
  const { sessionCookieValue } = await devLogin(db, parsed.data);
  context.cookies.set(SESSION_COOKIE_NAME, sessionCookieValue, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  const redirectTarget =
    safeRedirectTarget(formData.get("redirect")?.toString()) ?? "/perfil";
  return context.redirect(redirectTarget);
};
