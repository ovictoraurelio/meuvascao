import { describe, expect, it } from "vitest";

import {
  checkPairs,
  contrastRatio,
  MIN_CONTRAST_TEXT,
  MIN_CONTRAST_UI,
} from "@/lib/color/contrast";

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
    expect(contrastRatio("#101010", "#FAFAF7")).toBeGreaterThanOrEqual(
      MIN_CONTRAST_TEXT,
    );
  });

  it("ink-muted (#5C5C5C) sobre paper atende texto (AA), ~6,4:1", () => {
    expect(contrastRatio("#5C5C5C", "#FAFAF7")).toBeCloseTo(6.4, 1);
  });

  it("accent (#C51D2B) sobre paper atende texto (AA), ~5,6:1", () => {
    expect(contrastRatio("#C51D2B", "#FAFAF7")).toBeCloseTo(5.6, 1);
  });

  it("paper-muted (#B8B8B8) sobre superfície escura (ink) atende UI, ~9,6:1", () => {
    const ratio = contrastRatio("#B8B8B8", "#101010");
    expect(ratio).toBeCloseTo(9.6, 1);
    expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_UI);
  });

  it("paper-muted sobre paper NÃO atende texto (~1,9:1) — proibido para texto nos tokens", () => {
    const ratio = contrastRatio("#B8B8B8", "#FAFAF7");
    expect(ratio).toBeCloseTo(1.9, 1);
    expect(ratio).toBeLessThan(MIN_CONTRAST_TEXT);
    // Também não atende nem o piso mais permissivo de UI: paper-muted sobre paper não serve nem
    // para um alvo não textual (borda, ícone), só sobre superfície escura.
    expect(ratio).toBeLessThan(MIN_CONTRAST_UI);
  });

  it("accent sobre superfície escura (ink) NÃO atende texto (~3,3:1) — por isso existe accent-on-dark", () => {
    const ratio = contrastRatio("#C51D2B", "#101010");
    expect(ratio).toBeCloseTo(3.25, 1);
    expect(ratio).toBeLessThan(MIN_CONTRAST_TEXT);
    // Mas atende o piso de UI (bordas, ícones) mesmo sobre superfície escura.
    expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST_UI);
  });

  it("accent-on-dark (#F0424E) sobre superfície escura (ink) atende texto (AA)", () => {
    expect(contrastRatio("#F0424E", "#101010")).toBeGreaterThanOrEqual(
      MIN_CONTRAST_TEXT,
    );
  });
});

describe("checkPairs", () => {
  it("retorna vazio quando todos os pares atendem o mínimo declarado", () => {
    const failures = checkPairs([
      {
        label: "ink/paper",
        foreground: "#101010",
        background: "#FAFAF7",
        minRatio: MIN_CONTRAST_TEXT,
      },
      {
        label: "accent/paper",
        foreground: "#C51D2B",
        background: "#FAFAF7",
        minRatio: MIN_CONTRAST_TEXT,
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
        minRatio: MIN_CONTRAST_TEXT,
      },
    ]);
    expect(failures).toHaveLength(1);
    expect(failures[0]).toContain("paper-muted/paper");
    expect(failures[0]).toContain("1.9");
  });
});
