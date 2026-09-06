import { and, asc, desc, eq, isNull } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import {
  auditLog,
  comments,
  matches,
  reports,
  settings,
  threads,
  users,
} from "@/lib/db/schema";
import type { User } from "@/modules/identidade";

export class ModerationTargetError extends Error {}
function audit(
  actor: User,
  action: string,
  targetType: string,
  targetId: string,
  reason: string,
  before: unknown,
  after: unknown,
) {
  return {
    id: crypto.randomUUID(),
    actorId: actor.id,
    actorRole: actor.role,
    action,
    targetType,
    targetId,
    reason,
    beforeJson: JSON.stringify(before),
    afterJson: JSON.stringify(after),
    createdAt: new Date(),
  };
}
export async function listModerationRecords(db: Database) {
  const [queue, conversations, suspendedUsers, writing] = await Promise.all([
    db
      .select({
        id: reports.id,
        commentId: reports.commentId,
        reason: reports.reason,
        createdAt: reports.createdAt,
        body: comments.body,
        commentStatus: comments.status,
        authorId: comments.authorId,
        nickname: users.nickname,
        threadId: comments.threadId,
      })
      .from(reports)
      .innerJoin(comments, eq(comments.id, reports.commentId))
      .leftJoin(users, eq(users.id, comments.authorId))
      .where(eq(reports.status, "open"))
      .orderBy(asc(reports.createdAt), asc(reports.id))
      .limit(100),
    db
      .select({
        id: threads.id,
        status: threads.status,
        slowModeSeconds: threads.slowModeSeconds,
        opponentName: matches.opponentName,
        slug: matches.slug,
      })
      .from(threads)
      .innerJoin(matches, eq(matches.id, threads.matchId))
      .where(isNull(matches.deletedAt))
      .orderBy(desc(threads.updatedAt), desc(threads.id))
      .limit(100),
    db
      .select({
        id: users.id,
        nickname: users.nickname,
        suspendedReason: users.suspendedReason,
      })
      .from(users)
      .where(and(eq(users.status, "suspended"), isNull(users.deletedAt)))
      .orderBy(desc(users.updatedAt), desc(users.id))
      .limit(100),
    db
      .select({ valueJson: settings.valueJson })
      .from(settings)
      .where(eq(settings.key, "escrita_fechada")),
  ]);
  return {
    queue,
    conversations,
    suspendedUsers,
    writingClosed: writing[0]?.valueJson === "true",
  };
}
export async function hideCommentRecord(
  db: Database,
  actor: User,
  input: { id: string; reason: string },
) {
  const [before] = await db
    .select({ status: comments.status })
    .from(comments)
    .where(eq(comments.id, input.id));
  if (!before || before.status === "deleted")
    throw new ModerationTargetError("Comentário não encontrado.");
  const after = { status: "hidden" as const };
  await db.batch([
    db
      .update(comments)
      .set({ ...after, updatedAt: new Date() })
      .where(eq(comments.id, input.id)),
    db
      .update(reports)
      .set({ status: "resolved", resolvedAt: new Date(), resolvedBy: actor.id })
      .where(and(eq(reports.commentId, input.id), eq(reports.status, "open"))),
    db
      .insert(auditLog)
      .values(
        audit(
          actor,
          "comment.hide",
          "comment",
          input.id,
          input.reason,
          before,
          after,
        ),
      ),
  ]);
}
export async function resolveReportRecord(
  db: Database,
  actor: User,
  input: { id: string; reason: string },
) {
  const [before] = await db
    .select({ status: reports.status })
    .from(reports)
    .where(eq(reports.id, input.id));
  if (!before) throw new ModerationTargetError("Denúncia não encontrada.");
  const after = { status: "resolved" as const, resolvedBy: actor.id };
  await db.batch([
    db
      .update(reports)
      .set({ ...after, resolvedAt: new Date() })
      .where(eq(reports.id, input.id)),
    db
      .insert(auditLog)
      .values(
        audit(
          actor,
          "report.resolve",
          "report",
          input.id,
          input.reason,
          before,
          after,
        ),
      ),
  ]);
}
export async function setUserSuspendedRecord(
  db: Database,
  actor: User,
  input: { id: string; suspended: boolean; reason: string },
) {
  const [before] = await db
    .select({
      status: users.status,
      suspendedReason: users.suspendedReason,
      role: users.role,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, input.id));
  if (!before || before.status === "deleted" || before.deletedAt)
    throw new ModerationTargetError("Conta não encontrada.");
  if (
    actor.id === input.id ||
    (actor.role !== "admin" && ["moderador", "admin"].includes(before.role))
  )
    throw new ModerationTargetError(
      "Esta conta exige revisão de outro administrador.",
    );
  const after = {
    status: input.suspended ? ("suspended" as const) : ("active" as const),
    suspendedReason: input.suspended ? input.reason : null,
  };
  await db.batch([
    db
      .update(users)
      .set({ ...after, suspendedUntil: null, updatedAt: new Date() })
      .where(eq(users.id, input.id)),
    db
      .insert(auditLog)
      .values(
        audit(
          actor,
          input.suspended ? "user.suspend" : "user.reactivate",
          "user",
          input.id,
          input.reason,
          { status: before.status, suspendedReason: before.suspendedReason },
          after,
        ),
      ),
  ]);
}
export async function setThreadRecord(
  db: Database,
  actor: User,
  id: string,
  patch: { status?: "open" | "closed"; slowModeSeconds?: number },
  reason: string,
) {
  const [before] = await db
    .select({
      status: threads.status,
      slowModeSeconds: threads.slowModeSeconds,
    })
    .from(threads)
    .where(eq(threads.id, id));
  if (!before) throw new ModerationTargetError("Resenha não encontrada.");
  const after = { ...before, ...patch };
  await db.batch([
    db
      .update(threads)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(threads.id, id)),
    db
      .insert(auditLog)
      .values(
        audit(
          actor,
          patch.status ? "thread.status" : "thread.slow_mode",
          "thread",
          id,
          reason,
          before,
          after,
        ),
      ),
  ]);
}
export async function setWritingClosedRecord(
  db: Database,
  actor: User,
  input: { closed: boolean; reason: string },
) {
  const key = "escrita_fechada";
  const [before] = await db
    .select({ valueJson: settings.valueJson })
    .from(settings)
    .where(eq(settings.key, key));
  const now = new Date();
  const after = {
    valueJson: JSON.stringify(input.closed),
    updatedBy: actor.id,
    updatedAt: now,
  };
  await db.batch([
    db
      .insert(settings)
      .values({ key, ...after, createdAt: now })
      .onConflictDoUpdate({ target: settings.key, set: after }),
    db
      .insert(auditLog)
      .values(
        audit(
          actor,
          "writing.status",
          "setting",
          key,
          input.reason,
          before ?? null,
          { valueJson: after.valueJson },
        ),
      ),
  ]);
}
