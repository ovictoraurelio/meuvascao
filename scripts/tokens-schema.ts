import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { z } from "zod";

const contrastPairSchema = z.object({
  label: z.string(),
  foreground: z.string(),
  background: z.string(),
  minRatio: z.number(),
});

const fontRoleSchema = z.object({
  family: z.string(),
  weight: z.number(),
});

const tokensSchema = z.object({
  color: z.record(z.string(), z.string()),
  contrastPairs: z.array(contrastPairSchema),
  font: z.object({
    display: fontRoleSchema,
    body: fontRoleSchema,
  }),
  type: z.record(z.string(), z.string()),
  space: z.record(z.string(), z.string()),
  radius: z.record(z.string(), z.string()),
  size: z.record(z.string(), z.string()),
});

export type Tokens = z.infer<typeof tokensSchema>;
export type ContrastPairDecl = z.infer<typeof contrastPairSchema>;

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
  const raw: unknown = JSON.parse(readFileSync(tokensPath, "utf-8"));
  const result = tokensSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `${tokensPath} não tem o formato esperado:\n${result.error.message}`,
    );
  }
  return result.data;
}

/**
 * Verdadeiro quando o módulo em `moduleUrl` foi invocado diretamente pelo Node (uso: `if
 * (isMainModule(import.meta.url)) main();`), em vez de só importado por outro módulo ou teste.
 *
 * Comparar `import.meta.url === \`file://${process.argv[1]}\`` direto (sem esta função) falha em
 * dois casos reais: caminhos com espaço/acento (a URL vem percent-encoded, o argv não) e scripts
 * chamados por um symlink (argv mantém o caminho do link; a URL resolve para o alvo real). Os dois
 * falham em silêncio — `main()` nunca roda e nada indica isso —, então comparamos caminhos de
 * arquivo já resolvidos por `realpathSync`, não strings de URL.
 */
export function isMainModule(moduleUrl: string): boolean {
  const argvPath = process.argv[1];
  if (!argvPath) return false;
  try {
    return fileURLToPath(moduleUrl) === realpathSync(argvPath);
  } catch {
    return false;
  }
}
