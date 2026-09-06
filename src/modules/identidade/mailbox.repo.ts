import { desc, eq } from "drizzle-orm";

import type { Database } from "@/lib/db/client";
import { devMailbox } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

export type DevMailboxMessage = typeof devMailbox.$inferSelect;

export interface RecordDevMailboxMessageInput {
  to: string;
  subject: string;
  body: string;
  link: string;
}

/** Só existe fora de produção — quem decide isso é o chamador (email-dev-mailbox.ts), não aqui. */
export async function recordDevMailboxMessage(
  db: Database,
  input: RecordDevMailboxMessageInput,
): Promise<DevMailboxMessage> {
  const now = new Date();
  const [row] = await db
    .insert(devMailbox)
    .values({
      id: newId(),
      to: input.to,
      subject: input.subject,
      body: input.body,
      link: input.link,
      createdAt: now,
    })
    .returning();
  if (!row) throw new Error("falha ao registrar mensagem em dev_mailbox");
  return row;
}

/**
 * Mais recentes primeiro, para a página /dev/mailbox. `to` filtra pelo destinatário exato — sem
 * isso, um E2E rodando várias fatias em paralelo (cada uma pedindo seu próprio link) pode ver a
 * própria mensagem cair fora da janela de `limit` antes de conseguir lê-la.
 */
export async function listRecentDevMailboxMessages(
  db: Database,
  { limit = 20, to }: { limit?: number; to?: string } = {},
): Promise<DevMailboxMessage[]> {
  const query = db.select().from(devMailbox);
  return (to ? query.where(eq(devMailbox.to, to)) : query)
    .orderBy(desc(devMailbox.createdAt))
    .limit(limit);
}
