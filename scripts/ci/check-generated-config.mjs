#!/usr/bin/env node
// Confere o dist/server/wrangler.json gerado pelo build antes de publicar: ambiente certo,
// nenhum database_id placeholder e nome do Worker esperado. Evita publicar o build errado.
import { readFileSync } from "node:fs";

const expected = process.argv[2];
if (!["preview", "production"].includes(expected)) {
  console.error("uso: check-generated-config.mjs <preview|production>");
  process.exit(2);
}
const config = JSON.parse(readFileSync("dist/server/wrangler.json", "utf8"));
const problems = [];
if (config.targetEnvironment !== expected) {
  problems.push(
    `targetEnvironment é ${String(config.targetEnvironment)}, esperado ${expected}. Use npm run build:${expected}.`,
  );
}
if (config.vars?.ENVIRONMENT !== expected) {
  problems.push(
    `vars.ENVIRONMENT é ${String(config.vars?.ENVIRONMENT)}, esperado ${expected}.`,
  );
}
for (const db of config.d1_databases ?? []) {
  if (!/^[0-9a-f-]{36}$/i.test(db.database_id ?? "")) {
    problems.push(
      `d1_databases[${db.binding}].database_id inválido ou placeholder (${db.database_id}). Siga docs/runbooks/deploy.md, seção 'Bancos D1'.`,
    );
  }
}
if (problems.length > 0) {
  for (const p of problems) console.error(`::error::${p}`);
  process.exit(1);
}
console.log(
  `Configuração gerada válida para ${expected} (worker ${config.name}).`,
);
