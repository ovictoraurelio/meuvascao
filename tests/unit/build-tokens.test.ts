import { describe, expect, it } from "vitest";

import { renderTokensCss } from "../../scripts/build-tokens";
import { readTokens, type Tokens } from "../../scripts/tokens-schema";

function fixture(): Tokens {
  return {
    color: { ink: "#101010", paper: "#FAFAF7" },
    contrastPairs: [],
    font: {
      display: { family: '"Barlow Condensed", sans-serif', weight: 700 },
      body: { family: '"DM Sans", sans-serif', weight: 400 },
    },
    type: { xs: "0.75rem", base: "1rem" },
    space: { "1": "0.25rem" },
    radius: { sm: "0.25rem" },
    size: { "tap-target-min": "2.75rem" },
  };
}

describe("renderTokensCss", () => {
  it("declara uma custom property por token, dentro de :root", () => {
    const css = renderTokensCss(fixture());
    expect(css).toContain(":root {");
    expect(css).toContain("--color-ink: #101010;");
    expect(css).toContain("--color-paper: #FAFAF7;");
    expect(css).toContain('--font-display: "Barlow Condensed", sans-serif;');
    expect(css).toContain("--font-display-weight: 700;");
    expect(css).toContain("--type-xs: 0.75rem;");
    expect(css).toContain("--space-1: 0.25rem;");
    expect(css).toContain("--radius-sm: 0.25rem;");
    expect(css).toContain("--size-tap-target-min: 2.75rem;");
  });

  it("é determinístico: mesma entrada produz o mesmo CSS byte a byte", () => {
    const tokens = fixture();
    expect(renderTokensCss(tokens)).toBe(renderTokensCss(tokens));
  });
});

describe("design/tokens.json (arquivo real) gerado em src/styles/tokens.css", () => {
  it("o arquivo commitado é exatamente o que o gerador produz hoje", async () => {
    const { readFile } = await import("node:fs/promises");
    const path = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const committedPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "src",
      "styles",
      "tokens.css",
    );
    const committed = await readFile(committedPath, "utf-8");
    expect(committed).toBe(renderTokensCss(readTokens()));
  });
});
