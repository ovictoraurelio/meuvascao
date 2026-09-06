import type { APIRoute } from "astro";
import { getEnv, isProduction } from "@/lib/env";

export const GET: APIRoute = () => {
  const body = isProduction()
    ? `User-agent: *\nAllow: /\nSitemap: ${new URL("/sitemap.xml", getEnv().SITE_URL).href}\n`
    : "User-agent: *\nDisallow: /\n";
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
