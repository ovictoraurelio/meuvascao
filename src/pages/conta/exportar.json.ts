import type { APIRoute } from "astro";

import { exportOwnCommunityData } from "@/modules/comunidade";
import { getRequestDb } from "@/lib/db/client";
import { buildAccountExport, getAuthenticatedUser } from "@/modules/identidade";

export const GET: APIRoute = async (context) => {
  const db = getRequestDb();
  const authenticated = await getAuthenticatedUser(db, context.locals.session);
  if (!authenticated) {
    return context.redirect(
      `/entrar?redirect=${encodeURIComponent("/conta/exportar.json")}`,
    );
  }

  const data = {
    ...buildAccountExport(authenticated.user),
    comunidade: await exportOwnCommunityData(db, authenticated.user.id),
  };
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="meu-vascao-dados.json"',
      "Cache-Control": "private, no-store",
    },
  });
};
