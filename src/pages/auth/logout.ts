import type { APIRoute } from "astro";
import { z } from "zod";

import { getRequestDb } from "@/lib/db/client";
import {
  clearSessionCookie,
  getAuthenticatedUser,
  revokeAllSessionsForUser,
  revokeSession,
} from "@/modules/identidade";

const logoutSchema = z.object({
  // Botão "Sair de todos os dispositivos" (perfil) manda escopo=todos; "Sair" simples não manda
  // nada.
  escopo: z.enum(["atual", "todos"]).default("atual"),
});

// `security.checkOrigin` (astro.config.ts) protege qualquer rota com POST/PUT/PATCH/DELETE,
// não só Actions — é por isso que este endpoint comum já rejeita uma Origin alheia com 403 sem
// nenhum código extra aqui (é o mesmo mecanismo que protege as Actions contra CSRF).
export const POST: APIRoute = async (context) => {
  const session = context.locals.session;
  if (session) {
    const db = getRequestDb();
    const formData = await context.request.formData().catch(() => null);
    const { escopo } = logoutSchema.parse({
      escopo: formData?.get("escopo") || undefined,
    });
    if (escopo === "todos") {
      const authenticated = await getAuthenticatedUser(db, session);
      if (authenticated)
        await revokeAllSessionsForUser(db, authenticated.user.id);
    } else {
      await revokeSession(db, session.sid);
    }
  }
  clearSessionCookie(context.cookies);
  return context.redirect("/");
};
