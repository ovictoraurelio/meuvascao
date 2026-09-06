import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

test.each([
  ["development", "ok", "200", "200", 0],
  ["preview", "ok", "200", "404", 0],
  ["preview", "ok", "200", "200", 1],
  ["production", "ok", "200", "404", 0],
  ["production", "ok", "200", "200", 1],
  ["preview", "error", "200", "404", 1],
  ["preview", "ok", "500", "404", 1],
])(
  "smoke %s db=%s pages=%s dev=%s returns %i",
  (environment, db, pages, dev, expected) => {
    const directory = mkdtempSync(join(tmpdir(), "smoke-test-"));
    try {
      writeFileSync(
        join(directory, "curl"),
        `#!/bin/sh
method=GET
for arg in "$@"; do
  [ "$arg" != POST ] || method=POST
  url="$arg"
done
case "$url" in
  */api/health) printf '%s' '{"ok":true,"db":"${db}","env":"${environment}"}' ;;
  */dev/mailbox) [ "$method" = GET ] && printf '%s' '${dev}' ;;
  */auth/dev-login) [ "$method" = POST ] && printf '%s' '${dev}' ;;
  *) printf '%s' '${pages}' ;;
esac
`,
        { mode: 0o700 },
      );
      // Falhas encerram na primeira espera para manter o teste rápido.
      writeFileSync(join(directory, "sleep"), "#!/bin/sh\nexit 1\n", {
        mode: 0o700,
      });
      const result = spawnSync(
        "sh",
        ["scripts/ci/smoke.sh", "https://example.test", environment],
        {
          encoding: "utf8",
          env: { ...process.env, PATH: `${directory}:${process.env.PATH}` },
        },
      );
      expect(result.status).toBe(expected);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
