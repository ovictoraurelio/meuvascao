import { desc, eq, inArray, isNull } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { auditLog, curatedLinks, leads, matches } from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import { buildMatchSlug } from "@/modules/partidas";
import { normalizeUrl } from "@/modules/curadoria";
import type { User } from "@/modules/identidade";
import type { LinkInput, MatchInput } from "./input";
import { csvCell } from "./csv";

function audit(
  actor: User,
  action: string,
  targetType: string,
  targetId: string,
  before: unknown,
  after: unknown,
) {
  return {
    id: newId(),
    actorId: actor.id,
    actorRole: actor.role,
    action,
    targetType,
    targetId,
    beforeJson: before ? JSON.stringify(before) : null,
    afterJson: JSON.stringify(after),
    createdAt: new Date(),
  };
}
export async function saveMatchRecord(
  db: Database,
  actor: User,
  input: MatchInput,
) {
  const [before] = input.id
    ? await db.select().from(matches).where(eq(matches.id, input.id))
    : [];
  if (input.id && (!before || before.deletedAt))
    throw new Error("Jogo não encontrado.");
  const id = before?.id ?? newId();
  const now = new Date();
  const after = {
    ...input,
    id,
    slug: before?.slug ?? buildMatchSlug(input.opponentName, id),
    kickoffAt: input.kickoffAt ? new Date(`${input.kickoffAt}:00-03:00`) : null,
    kickoffPrecision: input.kickoffAt
      ? ("confirmado" as const)
      : ("indefinido" as const),
    scoreVasco: input.status === "encerrado" ? input.scoreVasco : null,
    scoreOpponent: input.status === "encerrado" ? input.scoreOpponent : null,
    updatedBy: actor.id,
    updatedAt: now,
    createdAt: before?.createdAt ?? now,
  };
  const mutation = before
    ? db.update(matches).set(after).where(eq(matches.id, id)).returning()
    : db.insert(matches).values(after).returning();
  const [rows] = await db.batch([
    mutation,
    db
      .insert(auditLog)
      .values(
        audit(
          actor,
          before ? "match.update" : "match.create",
          "match",
          id,
          before,
          after,
        ),
      ),
  ]);
  const row = rows[0];
  if (!row) throw new Error("Jogo não salvo.");
  return row;
}
export async function saveLinkRecord(
  db: Database,
  actor: User,
  input: LinkInput,
) {
  const [before] = input.id
    ? await db.select().from(curatedLinks).where(eq(curatedLinks.id, input.id))
    : [];
  if (input.id && (!before || before.deletedAt))
    throw new Error("Link não encontrado.");
  const id = before?.id ?? newId();
  const now = new Date();
  const after = {
    ...input,
    id,
    urlNormalized: normalizeUrl(input.url),
    status: "publicado" as const,
    curatedBy: actor.id,
    createdAt: before?.createdAt ?? now,
    updatedAt: now,
  };
  const mutation = before
    ? db
        .update(curatedLinks)
        .set(after)
        .where(eq(curatedLinks.id, id))
        .returning()
    : db.insert(curatedLinks).values(after).returning();
  const [rows] = await db.batch([
    mutation,
    db
      .insert(auditLog)
      .values(
        audit(
          actor,
          before ? "link.update" : "link.publish",
          "link",
          id,
          before,
          after,
        ),
      ),
  ]);
  const row = rows[0];
  if (!row) throw new Error("Link não salvo.");
  return row;
}
export async function withdrawLinkRecord(
  db: Database,
  actor: User,
  id: string,
) {
  const [before] = await db
    .select()
    .from(curatedLinks)
    .where(eq(curatedLinks.id, id));
  if (!before || before.deletedAt) throw new Error("Link não encontrado.");
  const after = {
    ...before,
    status: "retirado" as const,
    updatedAt: new Date(),
    curatedBy: actor.id,
  };
  const [rows] = await db.batch([
    db
      .update(curatedLinks)
      .set(after)
      .where(eq(curatedLinks.id, id))
      .returning(),
    db
      .insert(auditLog)
      .values(audit(actor, "link.withdraw", "link", id, before, after)),
  ]);
  const row = rows[0];
  if (!row) throw new Error("Link não retirado.");
  return row;
}
export async function listAdminRecords(db: Database) {
  const [games, links] = await Promise.all([
    db
      .select()
      .from(matches)
      .where(isNull(matches.deletedAt))
      .orderBy(desc(matches.updatedAt)),
    db
      .select()
      .from(curatedLinks)
      .where(isNull(curatedLinks.deletedAt))
      .orderBy(desc(curatedLinks.updatedAt)),
  ]);
  return { games, links };
}
export async function exportLeadRecords(db: Database, actor: User) {
  const rows = await db.select().from(leads).where(isNull(leads.deletedAt));
  const now = new Date();
  const auditQuery = db.insert(auditLog).values(
    audit(actor, "lead.export", "leads", newId(), null, {
      total: rows.length,
    }),
  );
  const chunks = [];
  for (let offset = 0; offset < rows.length; offset += 90) {
    chunks.push(
      db
        .update(leads)
        .set({ exportedAt: now })
        .where(
          inArray(
            leads.id,
            rows.slice(offset, offset + 90).map((row) => row.id),
          ),
        ),
    );
  }
  const first = chunks.shift();
  if (first) await db.batch([first, ...chunks, auditQuery]);
  else await auditQuery;
  return [
    "canal,contato,origem,consentimento",
    ...rows.map((row) =>
      [row.channel, row.value, row.sourcePage, row.consentedAt.toISOString()]
        .map(csvCell)
        .join(","),
    ),
  ].join("\r\n");
}
