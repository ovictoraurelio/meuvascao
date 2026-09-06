import { describe, expect, it } from "vitest";

import { safeRedirectTarget } from "@/lib/http/redirect-safe";

describe("safeRedirectTarget", () => {
  it("aceita um caminho relativo, com âncora e query", () => {
    expect(safeRedirectTarget("/jogos/vasco-x-adversario-seed#comentar")).toBe(
      "/jogos/vasco-x-adversario-seed#comentar",
    );
  });

  it("rejeita nulo, indefinido e string vazia", () => {
    expect(safeRedirectTarget(null)).toBeNull();
    expect(safeRedirectTarget(undefined)).toBeNull();
    expect(safeRedirectTarget("")).toBeNull();
  });

  it("rejeita um domínio absoluto", () => {
    expect(safeRedirectTarget("https://evil.example")).toBeNull();
    expect(safeRedirectTarget("http://evil.example/jogos")).toBeNull();
  });

  it("rejeita uma URL protocol-relative (//)", () => {
    expect(safeRedirectTarget("//evil.example")).toBeNull();
  });

  it("rejeita a variante com barra invertida", () => {
    expect(safeRedirectTarget("/\\evil.example")).toBeNull();
  });

  it("rejeita CR/LF (injeção de cabeçalho)", () => {
    expect(safeRedirectTarget("/jogos\r\nSet-Cookie: x=1")).toBeNull();
  });

  it("rejeita um caminho que não começa com /", () => {
    expect(safeRedirectTarget("jogos/vasco-x-adversario-seed")).toBeNull();
  });
});
