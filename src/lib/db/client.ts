import { drizzle } from "drizzle-orm/d1";

import { getEnv } from "@/lib/env";

import * as schema from "./schema";

/** Cliente Drizzle sobre o binding D1 — o único ponto que repositórios usam para falar com o banco. */
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof getDb>;

/** Atalho para o caso comum (páginas e actions): cliente sobre o binding D1 do ambiente atual. */
export function getRequestDb(): Database {
  return getDb(getEnv().DB);
}

/** Sonda usada por /api/health: não passa pelo Drizzle, só confirma que o binding responde. */
export async function pingDatabase(db: D1Database): Promise<void> {
  await db.prepare("SELECT 1").first();
}
