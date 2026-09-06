import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema";

/** Cliente Drizzle sobre o binding D1 — o único ponto que repositórios usam para falar com o banco. */
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof getDb>;

/** Sonda usada por /api/health: não passa pelo Drizzle, só confirma que o binding responde. */
export async function pingDatabase(db: D1Database): Promise<void> {
  await db.prepare("SELECT 1").first();
}
