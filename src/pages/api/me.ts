import type { APIRoute } from "astro";
import { getRequestDb } from "@/lib/db/client";
import { getAuthenticatedUser } from "@/modules/identidade";
export const GET: APIRoute = async (context) => {
  const auth = await getAuthenticatedUser(
    getRequestDb(),
    context.locals.session,
  );
  return Response.json(
    {
      user: auth
        ? {
            nickname: auth.user.nickname,
            status: auth.user.status,
            role: auth.user.role,
          }
        : null,
    },
    {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    },
  );
};
