#!/usr/bin/env node
// Gate: toda action de GitHub em .github/workflows precisa estar fixada por SHA completo.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const SHA = /^[0-9a-f]{40}$/;

/**
 * @param {string} yaml
 * @returns {{ line: number, ref: string }[]}
 */
export function findUnpinned(yaml) {
  const unpinned = [];
  yaml.split("\n").forEach((text, index) => {
    const match = text.match(/^\s*-?\s*uses:\s*["']?([^\s"'#]+)/);
    if (!match) return;
    const ref = match[1];
    if (ref.startsWith("./") || ref.startsWith("docker://")) return;
    const at = ref.lastIndexOf("@");
    const version = at === -1 ? "" : ref.slice(at + 1);
    if (!SHA.test(version)) unpinned.push({ line: index + 1, ref });
  });
  return unpinned;
}

function main() {
  const dir = join(process.cwd(), ".github", "workflows");
  let failures = 0;
  for (const file of readdirSync(dir).filter((f) => /\.ya?ml$/.test(f))) {
    for (const { line, ref } of findUnpinned(
      readFileSync(join(dir, file), "utf8"),
    )) {
      console.error(`${file}:${line}: action não fixada por SHA: ${ref}`);
      failures++;
    }
  }
  if (failures > 0) process.exit(1);
  console.log("check-actions-pinned: todas as actions fixadas por SHA.");
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  main();
