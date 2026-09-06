import { describe, expect, it } from "vitest";

import { checkPairs, contrastRatio } from "@/lib/color/contrast";

describe("contrastRatio", () => {
  it("preto sobre branco é o contraste máximo (21:1)", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 1);
  });

  it("é simétrico entre as duas cores", () => {
    expect(contrastRatio("#101010", "#FAFAF7")).toBeCloseTo(
      contrastRatio("#FAFAF7", "#101010"),
      5,
    );
  });

  it("rejeita cores fora do formato hex de 6 dígitos", () => {
    expect(() => contrastRatio("#fff", "#000000")).toThrow();
    expect(() => contrastRatio("101010", "#FAFAF7")).toThrow();
  });
});

// Razões conferidas independentemente da implementação (fórmula WCAG 2.x aplicada à mão) contra a
// paleta decidida na revisão de personas (docs/06) para design/tokens.json (fatia F2). Travam a
// regressão dos números citados na decisão e documentam por que accent-on-dark existe.
describe("paleta planejada para design/tokens.json", () => {
  it("ink (#101010) sobre paper (#FAFAF7) atende texto (AA)", () => {
    expect(contrastRatio("#101010", "#FAFAF7")).toBeGreaterThanOrEqual(4.5);
  });

  it("ink-muted (#5C5C5C) sobre paper atende texto (AA), ~6,4:1", () => {
    expect(contrastRatio("#5C5C5C", "#FAFAF7")).toBeCloseTo(6.4, 1);
  });

  it("accent (#C51D2B) sobre paper atende texto (AA), ~5,6:1", () => {
    expect(contrastRatio("#C51D2B", "#FAFAF7")).toBeCloseTo(5.6, 1);
  });

  it("paper-muted (#B8B8B8) sobre superfície escura (ink) atende UI, ~9,6:1", () => {
    expect(contrastRatio("#B8B8B8", "#101010")).toBeCloseTo(9.6, 1);
  });

  it("paper-muted sobre paper NÃO atende texto (~1,9:1) — proibido para texto nos tokens", () => {
    const ratio = contrastRatio("#B8B8B8", "#FAFAF7");
    expect(ratio).toBeCloseTo(1.9, 1);
    expect(ratio).toBeLessThan(4.5);
  });

  it("accent sobre superfície escura (ink) NÃO atende texto (~3,3:1) — por isso existe accent-on-dark", () => {
    const ratio = contrastRatio("#C51D2B", "#101010");
    expect(ratio).toBeCloseTo(3.25, 1);
    expect(ratio).toBeLessThan(4.5);
  });

  it("accent-on-dark (#F0424E) sobre superfície escura (ink) atende texto (AA)", () => {
    expect(contrastRatio("#F0424E", "#101010")).toBeGreaterThanOrEqual(4.5);
  });
});

describe("checkPairs", () => {
  it("retorna vazio quando todos os pares atendem o mínimo declarado", () => {
    const failures = checkPairs([
      {
        label: "ink/paper",
        foreground: "#101010",
        background: "#FAFAF7",
        minRatio: 4.5,
      },
      {
        label: "accent/paper",
        foreground: "#C51D2B",
        background: "#FAFAF7",
        minRatio: 4.5,
      },
    ]);
    expect(failures).toEqual([]);
  });

  it("reporta cada par abaixo do mínimo, com a razão calculada na mensagem", () => {
    const failures = checkPairs([
      {
        label: "paper-muted/paper",
        foreground: "#B8B8B8",
        background: "#FAFAF7",
        minRatio: 4.5,
      },
    ]);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("paper-muted/paper");
    expect(failures[0]).toContain("1.9");
  });
});
