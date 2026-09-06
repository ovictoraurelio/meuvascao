import type { APIRoute } from "astro";

import { getRequestDb } from "@/lib/db/client";
import {
  revokeAllSessionsForUser,
  revokeSession,
  SESSION_COOKIE_NAME,
} from "@/modules/identidade";

// `security.checkOrigin` (astro.config.ts) protege qualquer rota com POST/PUT/PATCH/DELETE,
// não só Actions — é por isso que este endpoint comum já rejeita uma Origin alheia com 403 sem
// nenhum código extra aqui (é o mesmo mecanismo que protege as Actions contra CSRF).
export const POST: APIRoute = async (context) => {
  const session = context.locals.session;
  if (session) {
    const db = getRequestDb();
    const formData = await context.request.formData().catch(() => null);
    // Botão "Sair de todos os dispositivos" (perfil) manda escopo=todos; "Sair" simples não manda
    // nada.
    if (formData?.get("escopo") === "todos") {
      await revokeAllSessionsForUser(db, session.uid);
    } else {
      await revokeSession(db, session.sid);
    }
  }
  context.cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
  return context.redirect("/");
};
