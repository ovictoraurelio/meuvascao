#!/usr/bin/env node
// Gate: toda action de GitHub em .github/workflows e em actions locais (.github/actions/**/action.yml)
// precisa estar fixada por SHA completo.
import { existsSync, readdirSync, readFileSync, realpathSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Casa `uses` como chave em qualquer posição da linha: sintaxe de bloco (`- uses: x`), flow
// mapping (`- { uses: x }`) e chave entre aspas (`"uses": x`). O valor pode vir na linha seguinte.
const USES_KEY = /(?:^|[\s{,])["']?uses["']?\s*:\s*(?:["']?([^\s"',}#]+))?/;
const SCALAR = /^\s*["']?([^\s"',}#]+)/;
const PINNED = /@[0-9a-f]{40}$/;

const stripComment = (text) => text.replace(/(^|\s)#.*$/, "");

/**
 * @param {string} yaml
 * @returns {{ line: number, ref: string }[]}
 */
export function findUnpinned(yaml) {
  const unpinned = [];
  const lines = yaml.split("\n").map(stripComment);
  lines.forEach((text, index) => {
    const match = text.match(USES_KEY);
    if (!match) return;
    let ref = match[1];
    let line = index + 1;
    if (!ref) {
      ref = (lines[index + 1] ?? "").match(SCALAR)?.[1] ?? "";
      line = index + 2;
    }
    if (ref.startsWith("./") || ref.startsWith("docker://")) return;
    if (!PINNED.test(ref)) unpinned.push({ line, ref: ref || "(vazio)" });
  });
  return unpinned;
}

/**
 * Workflows em .github/workflows e actions locais (action.yml) em .github/actions, recursivamente.
 * @param {string} root
 * @returns {string[]}
 */
export function listWorkflowFiles(root) {
  const files = [];
  const workflows = join(root, ".github", "workflows");
  if (existsSync(workflows)) {
    for (const f of readdirSync(workflows)) {
      if (/\.ya?ml$/.test(f)) files.push(join(workflows, f));
    }
  }
  const actions = join(root, ".github", "actions");
  if (existsSync(actions)) {
    for (const entry of readdirSync(actions, {
      recursive: true,
      withFileTypes: true,
    })) {
      if (entry.isFile() && /^action\.ya?ml$/.test(entry.name)) {
        files.push(join(entry.parentPath, entry.name));
      }
    }
  }
  return files;
}

function main() {
  let failures = 0;
  for (const file of listWorkflowFiles(process.cwd())) {
    for (const { line, ref } of findUnpinned(readFileSync(file, "utf8"))) {
      console.error(`${file}:${line}: action não fixada por SHA: ${ref}`);
      failures++;
    }
  }
  if (failures > 0) process.exit(1);
  console.log("check-actions-pinned: todas as actions fixadas por SHA.");
}

// Node resolve o módulo principal pelo caminho real; argv[1] pode vir por symlink.
function invokedAsScript() {
  try {
    return (
      realpathSync(process.argv[1] ?? "") === fileURLToPath(import.meta.url)
    );
  } catch {
    return false;
  }
}

if (invokedAsScript()) main();
