import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export interface ContrastPairDecl {
  label: string;
  foreground: string;
  background: string;
  minRatio: number;
}

export interface Tokens {
  color: Record<string, string>;
  contrastPairs: ContrastPairDecl[];
  font: {
    display: { family: string; weight: number };
    body: { family: string; weight: number };
  };
  type: Record<string, string>;
  space: Record<string, string>;
  radius: Record<string, string>;
  size: Record<string, string>;
}

/** Caminho absoluto de `design/tokens.json`, relativo a este arquivo (não ao cwd de quem chama). */
export function tokensJsonPath(): string {
  return path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "design",
    "tokens.json",
  );
}

export function readTokens(tokensPath: string = tokensJsonPath()): Tokens {
  return JSON.parse(readFileSync(tokensPath, "utf-8")) as Tokens;
}
