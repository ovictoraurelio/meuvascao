import { describe, expect, it } from "vitest";

import { checkPairs } from "@/lib/color/contrast";

import { resolveContrastPairs } from "../../scripts/check-tokens";
import { readTokens, type Tokens } from "../../scripts/tokens-schema";

function fontFixture() {
  return {
    display: { family: "sans-serif", weight: 700 },
    body: { family: "sans-serif", weight: 400 },
  };
}

describe("resolveContrastPairs", () => {
  it("troca nomes de cor pelos hex declarados em `color`", () => {
    const tokens: Tokens = {
      color: { ink: "#101010", paper: "#FAFAF7" },
      contrastPairs: [
        {
          label: "ink/paper",
          foreground: "ink",
          background: "paper",
          minRatio: 4.5,
        },
      ],
      font: fontFixture(),
      type: {},
      space: {},
      radius: {},
      size: {},
    };
    expect(resolveContrastPairs(tokens)).toEqual([
      {
        label: "ink/paper",
        foreground: "#101010",
        background: "#FAFAF7",
        minRatio: 4.5,
      },
    ]);
  });

  it("lança ao referenciar uma cor que não existe em `color`", () => {
    const tokens: Tokens = {
      color: { ink: "#101010" },
      contrastPairs: [
        {
          label: "ink/inexistente",
          foreground: "ink",
          background: "fantasma",
          minRatio: 4.5,
        },
      ],
      font: fontFixture(),
      type: {},
      space: {},
      radius: {},
      size: {},
    };
    expect(() => resolveContrastPairs(tokens)).toThrow(/fantasma/);
  });
});

describe("design/tokens.json (arquivo real)", () => {
  it("todos os pares declarados atendem o mínimo de contraste", () => {
    const failures = checkPairs(resolveContrastPairs(readTokens()));
    expect(failures).toEqual([]);
  });
});
