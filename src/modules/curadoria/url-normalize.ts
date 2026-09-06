// Normaliza uma URL para deduplicação (docs/03): host minúsculo, sem fragmento, sem parâmetros de
// rastreio (utm_*), parâmetros restantes ordenados para que `?b=2&a=1` e `?a=1&b=2` dedupliquem
// como a mesma URL. Parâmetros identificadores (`id`, `v`, `articleId`...) são preservados —
// só o prefixo `utm_` é removido.
export function normalizeUrl(rawUrl: string): string {
  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`protocolo não permitido em link curado: ${url.protocol}`);
  }

  url.hostname = url.hostname.toLowerCase();
  url.hash = "";

  const params = new URLSearchParams(url.search);
  for (const key of [...params.keys()]) {
    if (key.toLowerCase().startsWith("utm_")) params.delete(key);
  }
  params.sort();
  url.search = params.toString();

  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    url.pathname = url.pathname.slice(0, -1);
  }

  return url.toString();
}
