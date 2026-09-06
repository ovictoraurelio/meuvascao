import { describe, expect, it } from "vitest";

import { normalizeUrl } from "@/modules/curadoria/url-normalize";

describe("normalizeUrl", () => {
  it("deixa o host em minúsculas", () => {
    expect(normalizeUrl("https://GLOBO.com/noticia")).toBe(
      "https://globo.com/noticia",
    );
  });

  it("remove parâmetros utm_*, preservando identificadores", () => {
    expect(
      normalizeUrl(
        "https://g1.com/materia?id=42&utm_source=whatsapp&utm_medium=social",
      ),
    ).toBe("https://g1.com/materia?id=42");
  });

  it("ordena os parâmetros restantes para deduplicar independente da ordem", () => {
    expect(normalizeUrl("https://x.com/a?b=2&a=1")).toBe(
      normalizeUrl("https://x.com/a?a=1&b=2"),
    );
  });

  it("remove o fragmento (#...)", () => {
    expect(normalizeUrl("https://x.com/materia#comentarios")).toBe(
      "https://x.com/materia",
    );
  });

  it("remove a barra final do caminho, exceto na raiz", () => {
    expect(normalizeUrl("https://x.com/materia/")).toBe(
      "https://x.com/materia",
    );
    expect(normalizeUrl("https://x.com/")).toBe("https://x.com/");
  });

  it("rejeita protocolos que não sejam http/https", () => {
    expect(() => normalizeUrl("javascript:alert(1)")).toThrow();
    expect(() => normalizeUrl("ftp://x.com/arquivo")).toThrow();
  });

  it("URLs equivalentes por rastreio e ordem normalizam para o mesmo valor", () => {
    const a = normalizeUrl(
      "https://Site.com/post?utm_source=x&ref=abc&utm_campaign=y",
    );
    const b = normalizeUrl("https://site.com/post?ref=abc");
    expect(a).toBe(b);
  });
});
