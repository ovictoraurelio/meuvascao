import { and, eq, isNull } from "drizzle-orm";

import type { Database } from "@/lib/db/client";
import { sessions } from "@/lib/db/schema";

export type Session = typeof sessions.$inferSelect;

export async function createSession(
  db: Database,
  input: { id: string; userId: string; expiresAt: Date },
): Promise<void> {
  const now = new Date();
  await db.insert(sessions).values({
    id: input.id,
    userId: input.userId,
    expiresAt: input.expiresAt,
    lastSeenAt: now,
    createdAt: now,
  });
}

/** Ativa: existe, não expirou, não foi revogada. Usado só em escritas e em /perfil (nunca em GET anônimo). */
export async function findActiveSession(
  db: Database,
  sessionId: string,
): Promise<Session | null> {
  const [row] = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), isNull(sessions.revokedAt)));
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) return null;
  return row;
}

export async function revokeSession(
  db: Database,
  sessionId: string,
): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.id, sessionId));
}

/** "Sair de todos os dispositivos": revoga toda sessão ativa do usuário, não só a atual. */
export async function revokeAllSessionsForUser(
  db: Database,
  userId: string,
): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}
