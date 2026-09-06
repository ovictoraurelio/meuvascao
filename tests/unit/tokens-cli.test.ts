import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { isMainModule } from "../../scripts/tokens-schema";

const repoRoot = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

function runScript(relativePath: string): string {
  return execFileSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "--disable-warning=ExperimentalWarning",
      relativePath,
    ],
    { cwd: repoRoot, encoding: "utf-8" },
  );
}

describe("isMainModule", () => {
  it("é falso quando process.argv[1] não é o arquivo do módulo (caso do teste rodando sob vitest)", () => {
    expect(isMainModule(import.meta.url)).toBe(false);
  });

  it("é falso sem lançar quando process.argv[1] aponta para um caminho inexistente", () => {
    const originalArgv = process.argv;
    process.argv = [...originalArgv];
    process.argv[1] = "/caminho/que/nao/existe.ts";
    try {
      expect(isMainModule(import.meta.url)).toBe(false);
    } finally {
      process.argv = originalArgv;
    }
  });

  it("é falso quando process.argv[1] está ausente", () => {
    const originalArgv = process.argv;
    process.argv = [originalArgv[0] ?? "node"];
    try {
      expect(isMainModule(import.meta.url)).toBe(false);
    } finally {
      process.argv = originalArgv;
    }
  });
});

// Verificação de ponta a ponta: `node --experimental-strip-types scripts/check-tokens.ts`
// precisa realmente detectar que é o módulo principal e rodar `main()` — é exatamente esse
// caminho que a comparação de string ingênua (import.meta.url === `file://${argv[1]}`) falhava
// em silêncio (caminho com espaço/acento, ou script chamado por symlink).
describe("scripts/check-tokens.ts como CLI", () => {
  it("roda main() e imprime o resultado ao ser chamado diretamente", () => {
    const output = runScript("scripts/check-tokens.ts");
    expect(output).toContain("check-tokens:");
  });
});
