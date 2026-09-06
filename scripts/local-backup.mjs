import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  rmSync,
  copyFileSync,
  constants,
  chmodSync,
  mkdirSync,
  readdirSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [mode, file, source = resolve(root, ".wrangler/state")] =
  process.argv.slice(2);
let workspace;
try {
  if (!file || !["export", "restore"].includes(mode))
    throw new Error(
      "Uso: backup-export.sh arquivo.sql [estado-local] | restore-rehearsal.sh arquivo.sql",
    );
  const target = resolve(file);
  if (mode === "restore" && !existsSync(target))
    throw new Error("Backup inexistente.");
  if (mode === "export" && existsSync(target))
    throw new Error("Destino existente; escolha outro arquivo.");
  if (mode === "export" && !existsSync(resolve(source, "v3/d1")))
    throw new Error("Estado D1 local inexistente.");
  process.umask(0o077);
  workspace = mkdtempSync(join(tmpdir(), "meuvascao-backup-"));
  const config = join(workspace, "wrangler.json");
  writeFileSync(
    config,
    JSON.stringify({
      name: "local-backup",
      compatibility_date: "2026-08-15",
      d1_databases: [
        {
          binding: "DB",
          database_name: "meuvascao-dev",
          database_id: "00000000-0000-4000-8000-000000000000",
        },
      ],
    }),
  );
  const state =
    mode === "export" ? resolve(source) : join(workspace, ".wrangler/state");
  if (mode === "export") {
    mkdirSync(join(workspace, ".wrangler"));
    symlinkSync(state, join(workspace, ".wrangler/state"));
  }
  const run = (args) => {
    const result = spawnSync(
      process.execPath,
      [
        join(root, "node_modules/wrangler/bin/wrangler.js"),
        "d1",
        ...args,
        "--local",
        ...(args[0] === "execute" ? ["--persist-to", state] : []),
        "--config",
        config,
      ],
      {
        cwd: workspace,
        env: {
          PATH: process.env.PATH,
          HOME: workspace,
          WRANGLER_SEND_METRICS: "false",
        },
        encoding: "utf8",
      },
    );
    if (result.status !== 0)
      throw new Error(
        "Operação D1 local falhou; saída omitida para proteger dados.",
      );
    return result.stdout;
  };
  const dump = join(workspace, "dump.sql");
  if (mode === "export") {
    run(["export", "DB", "--output", dump]);
    if (!readFileSync(dump, "utf8").trim()) throw new Error("Export vazio.");
    copyFileSync(dump, target, constants.COPYFILE_EXCL);
    chmodSync(target, 0o600);
    console.log("Backup local criado (permissão 0600). Guarde fora do Git.");
  } else {
    run(["execute", "DB", "--file", target]);
    const databaseFiles = readdirSync(state, { recursive: true }).filter(
      (name) =>
        name.startsWith("v3/d1/") &&
        name.endsWith(".sqlite") &&
        !name.endsWith("/metadata.sqlite"),
    );
    if (databaseFiles.length !== 1)
      throw new Error("Banco restaurado não identificado.");
    const integrity = spawnSync(
      "sqlite3",
      [
        "-readonly",
        join(state, databaseFiles[0]),
        "PRAGMA integrity_check; PRAGMA foreign_key_check;",
      ],
      { encoding: "utf8" },
    );
    if (integrity.status !== 0 || integrity.stdout.trim() !== "ok")
      throw new Error(
        "Integridade/referências reprovadas ou sqlite3 indisponível.",
      );
    run(["export", "DB", "--output", dump]);
    if (
      readFileSync(dump, "utf8").trim() !== readFileSync(target, "utf8").trim()
    )
      throw new Error("Reexportação diverge do backup; ensaio reprovado.");
    console.log(
      "Restore local aprovado: integridade, referências e reexportação idêntica. Estado temporário removido.",
    );
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  if (workspace) rmSync(workspace, { recursive: true, force: true });
}
