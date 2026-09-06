import type { APIRoute } from "astro";
import { getRequestDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import { listMatches } from "@/modules/partidas";

const escapeXml = (value: string) =>
  value.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c] ?? c,
  );
export const GET: APIRoute = async () => {
  const agenda = await listMatches(getRequestDb());
  const paths = [
    "/",
    "/jogos",
    "/resenha",
    "/sobre",
    "/regras-da-resenha",
    "/privacidade",
    ...[...agenda.upcoming, ...agenda.past].map(
      (match) => `/jogos/${encodeURIComponent(match.slug)}`,
    ),
  ];
  const urls = paths
    .map(
      (path) =>
        `<url><loc>${escapeXml(new URL(path, getEnv().SITE_URL).href)}</loc></url>`,
    )
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
};
