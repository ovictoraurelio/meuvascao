import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { isMainModule, readTokens, type Tokens } from "./tokens-schema.ts";

const HEADER = `/* Gerado por scripts/build-tokens.ts a partir de design/tokens.json. Não editar à mão: rode
   \`npm run tokens:build\` depois de mudar o JSON. A CI falha se este arquivo divergir do gerado. */`;

function cssVarName(prefix: string, key: string): string {
  return `--${prefix}-${key}`;
}

/** Gera o CSS de `:root` com as custom properties, uma seção por grupo de tokens. */
export function renderTokensCss(tokens: Tokens): string {
  const lines: string[] = [HEADER, "", ":root {"];

  lines.push("  /* Cor */");
  for (const [key, value] of Object.entries(tokens.color)) {
    lines.push(`  ${cssVarName("color", key)}: ${value};`);
  }

  lines.push("", "  /* Tipografia */");
  lines.push(`  --font-display: ${tokens.font.display.family};`);
  lines.push(`  --font-display-weight: ${tokens.font.display.weight};`);
  lines.push(`  --font-body: ${tokens.font.body.family};`);
  lines.push(`  --font-body-weight: ${tokens.font.body.weight};`);
  for (const [key, value] of Object.entries(tokens.type)) {
    lines.push(`  ${cssVarName("type", key)}: ${value};`);
  }

  lines.push("", "  /* Espaço */");
  for (const [key, value] of Object.entries(tokens.space)) {
    lines.push(`  ${cssVarName("space", key)}: ${value};`);
  }

  lines.push("", "  /* Raio e tamanho */");
  for (const [key, value] of Object.entries(tokens.radius)) {
    lines.push(`  ${cssVarName("radius", key)}: ${value};`);
  }
  for (const [key, value] of Object.entries(tokens.size)) {
    lines.push(`  ${cssVarName("size", key)}: ${value};`);
  }

  lines.push("}", "");
  return lines.join("\n");
}

function outputPath(): string {
  return path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "src",
    "styles",
    "tokens.css",
  );
}

function main(): void {
  const css = renderTokensCss(readTokens());
  writeFileSync(outputPath(), css);
  console.log(
    `build-tokens: escrito em ${path.relative(process.cwd(), outputPath())}`,
  );
}

if (isMainModule(import.meta.url)) {
  main();
}
