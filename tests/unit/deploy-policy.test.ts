import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

// Política de entrega (CLAUDE.md, regra 10): produção nunca por push; só workflow_dispatch com
// Environment protegido. Este teste lê o workflow como texto para travar essas garantias.
const workflow = readFileSync(
  new URL("../../.github/workflows/deploy.yml", import.meta.url),
  "utf8",
);

function job(name: string): string {
  const start = workflow.indexOf(`\n  ${name}:\n`);
  expect(start, `job ${name} não encontrado`).toBeGreaterThan(-1);
  const rest = workflow.slice(start + 1);
  const next = rest.slice(1).search(/\n {2}[a-z-]+:\n/);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

describe("política de entrega contínua", () => {
  it("não usa pull_request_target nem concede escrita no conteúdo", () => {
    expect(workflow).not.toContain("pull_request_target");
    expect(workflow).toMatch(/permissions:\n {2}contents: read/);
    expect(workflow).not.toMatch(/contents: write/);
  });

  it("produção só roda por workflow_dispatch, no Environment production, com confirmação", () => {
    const producao = job("producao");
    expect(producao).toContain("if: github.event_name == 'workflow_dispatch'");
    expect(producao).toMatch(/environment:\n {6}name: production/);
    expect(producao).toContain("inputs.confirmar != 'producao'");
    expect(producao).toContain("require-production-reviewers.sh");
    expect(producao).toContain("require-cloudflare-secrets.sh --strict");
    expect(producao).toContain("npm run build:production");
    expect(producao).toContain("check-generated-config.mjs production");
  });

  it("preview por PR ignora forks e usa o build de preview", () => {
    const preview = job("preview-pr");
    expect(preview).toContain(
      "github.event.pull_request.head.repo.full_name == github.repository",
    );
    expect(preview).toContain("npm run build:preview");
    expect(preview).toContain("check-generated-config.mjs preview");
    expect(preview).not.toContain("build:production");
  });

  it("nenhum job publica em produção a partir de push", () => {
    const main = job("preview-main");
    expect(main).toContain("if: github.event_name == 'push'");
    expect(main).not.toContain("production");
  });
});
