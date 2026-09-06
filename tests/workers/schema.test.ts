import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { getDb } from "@/lib/db/client";
import {
  auditLog,
  curatedLinks,
  leads,
  matches,
  settings,
} from "@/lib/db/schema";

// tests/workers/setup.ts já roda `applyD1Migrations` do zero antes deste arquivo; se
// 0001_fundacao.sql tivesse algo quebrado, toda consulta abaixo falharia, não só a esperada.
describe("migração 0001_fundacao: as cinco tabelas existem e começam vazias", () => {
  const db = getDb(env.DB);

  it("matches", async () => {
    expect(await db.select().from(matches)).toEqual([]);
  });

  it("curated_links", async () => {
    expect(await db.select().from(curatedLinks)).toEqual([]);
  });

  it("leads", async () => {
    expect(await db.select().from(leads)).toEqual([]);
  });

  it("settings", async () => {
    expect(await db.select().from(settings)).toEqual([]);
  });

  it("audit_log", async () => {
    expect(await db.select().from(auditLog)).toEqual([]);
  });
});
