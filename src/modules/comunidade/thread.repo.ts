import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { threads, matches } from "@/lib/db/schema";
export async function threadById(db: Database, id: string) {
  const [thread] = await db
    .select({ id: threads.id, matchId: threads.matchId })
    .from(threads)
    .innerJoin(matches, eq(matches.id, threads.matchId))
    .where(and(eq(threads.id, id), isNull(matches.deletedAt)));
  return thread ?? null;
}
