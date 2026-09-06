import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

test("backup refuses missing arguments without touching a database", () => {
  const result = spawnSync("sh", ["scripts/backup-export.sh"], {
    encoding: "utf8",
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Uso:");
});

test("restore refuses a missing backup", () => {
  const result = spawnSync(
    "sh",
    ["scripts/restore-rehearsal.sh", "/missing/backup.sql"],
    { encoding: "utf8" },
  );
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Backup inexistente");
});

test("operational smoke requires D1 and public pages; dev endpoints only in production", () => {
  const script = readFileSync("scripts/ci/smoke.sh", "utf8");
  expect(script).toContain('j.db === "ok"');
  expect(script).toContain("for path in / /jogos");
  expect(script).toContain('[ "$expected" = production ]');
});
