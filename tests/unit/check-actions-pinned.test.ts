import { describe, expect, it } from "vitest";

import { findUnpinned } from "../../scripts/check-actions-pinned.mjs";

const SHA = "d23441a48e516b6c34aea4fa41551a30e30af803";

describe("gate: actions fixadas por SHA", () => {
  it("aceita SHA completo, ações locais, docker e comentários", () => {
    const yaml = [
      "steps:",
      `  - uses: actions/checkout@${SHA} # v6`,
      "  - uses: ./.github/actions/local",
      "  - uses: docker://alpine:3.20",
      "  # uses: actions/checkout@v4 (comentário, não conta)",
      `  - { uses: actions/setup-node@${SHA} }`,
    ].join("\n");
    expect(findUnpinned(yaml)).toEqual([]);
  });

  it("rejeita tag, branch e SHA curto na sintaxe de bloco", () => {
    const yaml = [
      "  - uses: actions/checkout@v4",
      "  - uses: actions/setup-node@main",
      "  - uses: actions/upload-artifact@b7c566a7",
    ].join("\n");
    expect(findUnpinned(yaml).map((u) => u.ref)).toEqual([
      "actions/checkout@v4",
      "actions/setup-node@main",
      "actions/upload-artifact@b7c566a7",
    ]);
  });

  it("rejeita flow mapping, chave entre aspas e valor na linha seguinte", () => {
    const yaml = [
      "  - { uses: actions/checkout@v4 }",
      '  - "uses": actions/setup-node@v5',
      "  - uses:",
      "      actions/cache@v6",
      "  - uses: ",
    ].join("\n");
    expect(findUnpinned(yaml)).toEqual([
      { line: 1, ref: "actions/checkout@v4" },
      { line: 2, ref: "actions/setup-node@v5" },
      { line: 4, ref: "actions/cache@v6" },
      { line: 6, ref: "(vazio)" },
    ]);
  });

  it("rejeita workflow reutilizável por branch", () => {
    const yaml =
      "jobs:\n  ci:\n    uses: org/repo/.github/workflows/ci.yml@main";
    expect(findUnpinned(yaml)).toHaveLength(1);
  });
});

describe("gate: arquivos inspecionados", () => {
  it("inclui workflows e actions locais recursivamente", async () => {
    const { mkdtempSync, mkdirSync, writeFileSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    const { listWorkflowFiles } =
      await import("../../scripts/check-actions-pinned.mjs");
    const root = mkdtempSync(join(tmpdir(), "gate-"));
    mkdirSync(join(root, ".github", "workflows"), { recursive: true });
    mkdirSync(join(root, ".github", "actions", "setup", "nested"), {
      recursive: true,
    });
    writeFileSync(join(root, ".github", "workflows", "ci.yml"), "");
    writeFileSync(join(root, ".github", "workflows", "notas.md"), "");
    writeFileSync(join(root, ".github", "actions", "setup", "action.yml"), "");
    writeFileSync(
      join(root, ".github", "actions", "setup", "nested", "action.yaml"),
      "",
    );
    const found = listWorkflowFiles(root).map((f) => f.slice(root.length + 1));
    expect(found.sort()).toEqual([
      ".github/actions/setup/action.yml",
      ".github/actions/setup/nested/action.yaml",
      ".github/workflows/ci.yml",
    ]);
  });
});
