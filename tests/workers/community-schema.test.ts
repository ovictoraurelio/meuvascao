import { env } from "cloudflare:workers";
import { expect, it } from "vitest";
it("migração comunidade cria threads, comments, reactions e reports", async () => {
  for (const table of ["threads", "comments", "reactions", "reports"]) {
    const row = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    )
      .bind(table)
      .first();
    expect(row).not.toBeNull();
  }
});
