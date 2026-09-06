import type { APIRoute } from "astro";
import { getRequestDb } from "@/lib/db/client";
import { requireRole } from "@/modules/administracao";

export const GET: APIRoute = async (context) => {
  try {
    const actor = await requireRole(getRequestDb(), context.locals.session, [
      "editor",
      "moderador",
      "admin",
    ]);
    return context.redirect(
      actor.role === "moderador" ? "/admin/moderacao" : "/admin/jogos",
    );
  } catch {
    return new Response("Acesso restrito à equipe autorizada.", {
      status: 403,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }
};
