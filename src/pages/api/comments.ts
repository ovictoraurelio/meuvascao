import type { APIRoute } from "astro";
import { getRequestDb } from "@/lib/db/client";
import { listComments } from "@/modules/comunidade";
export const GET: APIRoute = async (context) => {
  try {
    const result = await listComments(
      getRequestDb(),
      context.url.searchParams.get("matchId") ?? "",
      context.url.searchParams.get("cursor"),
    );
    return Response.json(result, {
      headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
    });
  } catch {
    return Response.json(
      { error: "Consulta inválida." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
};
