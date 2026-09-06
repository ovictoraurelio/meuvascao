import { checkPairs, type ContrastPair } from "../src/lib/color/contrast.ts";
import { isMainModule, readTokens, type Tokens } from "./tokens-schema.ts";

/** Troca os nomes de cor de `contrastPairs` pelos hex declarados em `color`. */
export function resolveContrastPairs(tokens: Tokens): ContrastPair[] {
  return tokens.contrastPairs.map((pair) => {
    const foreground = tokens.color[pair.foreground];
    const background = tokens.color[pair.background];
    if (!foreground) {
      throw new Error(
        `design/tokens.json: cor desconhecida "${pair.foreground}"`,
      );
    }
    if (!background) {
      throw new Error(
        `design/tokens.json: cor desconhecida "${pair.background}"`,
      );
    }
    return {
      label: pair.label,
      foreground,
      background,
      minRatio: pair.minRatio,
    };
  });
}

function main(): void {
  const pairs = resolveContrastPairs(readTokens());
  const failures = checkPairs(pairs);
  if (failures.length > 0) {
    console.error(
      "check-tokens: par(es) de contraste abaixo do mínimo declarado:",
    );
    for (const failure of failures) console.error(`  - ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(
    `check-tokens: ${pairs.length} pares de contraste conferidos, todos ok.`,
  );
}

if (isMainModule(import.meta.url)) {
  main();
}
