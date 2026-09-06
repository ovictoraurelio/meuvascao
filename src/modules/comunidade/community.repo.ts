import { and, asc, desc, eq, gt, isNull, or, sql } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import {
  comments,
  matches,
  reactions,
  reports,
  settings,
  threads,
  users,
} from "@/lib/db/schema";
import { newId } from "@/lib/ids";
import type { SessionCookiePayload } from "@/modules/identidade";
import { decodeCursor, encodeCursor } from "./cursor";
import { CommunityError } from "./errors";

/** Rechecado dentro do statement de escrita: suspensão/revogação/kill switch não dependem da UI. */
function activeWriter(
  session: SessionCookiePayload,
  now: number,
  allowDuringPause = false,
) {
  return sql`EXISTS (SELECT 1 FROM users u JOIN sessions s ON s.user_id = u.id WHERE u.id = ${session.uid} AND u.status = 'active' AND u.nickname IS NOT NULL AND s.id = ${session.sid} AND s.revoked_at IS NULL AND s.expires_at > ${now}) AND (${allowDuringPause ? 1 : 0} = 1 OR NOT EXISTS (SELECT 1 FROM settings WHERE key = 'escrita_fechada' AND value_json = 'true'))`;
}
export async function findThread(db: Database, matchId: string) {
  const [thread] = await db
    .select()
    .from(threads)
    .where(eq(threads.matchId, matchId));
  return thread ?? null;
}
export async function findComment(db: Database, id: string) {
  const [row] = await db.select().from(comments).where(eq(comments.id, id));
  return row ?? null;
}
export async function writingClosed(db: Database) {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "escrita_fechada"));
  return row?.valueJson === "true";
}
export async function assertThreadWritable(
  db: Database,
  matchId: string,
  authorId?: string,
) {
  const thread = await findThread(db, matchId);
  if (thread?.status === "closed")
    throw new CommunityError("Esta resenha está fechada.", "FORBIDDEN");
  if (authorId && thread?.slowModeSeconds) {
    const [last] = await db
      .select()
      .from(comments)
      .where(
        and(eq(comments.authorId, authorId), eq(comments.threadId, thread.id)),
      )
      .orderBy(desc(comments.createdAt))
      .limit(1);
    const retry = last
      ? Math.ceil(
          (last.createdAt.getTime() +
            thread.slowModeSeconds * 1000 -
            Date.now()) /
            1000,
        )
      : 0;
    if (retry > 0)
      throw new CommunityError(
        `Modo lento: aguarde ${retry} segundos.`,
        "TOO_MANY_REQUESTS",
        retry,
      );
  }
  return thread;
}
export async function createCommentRecord(
  db: Database,
  session: SessionCookiePayload,
  input: {
    matchId: string;
    body: string;
    parentId?: string;
    idempotencyKey: string;
  },
) {
  const existing = await db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.authorId, session.uid),
        eq(comments.idempotencyKey, input.idempotencyKey),
      ),
    )
    .limit(1);
  if (existing[0]) return existing[0];
  await assertThreadWritable(db, input.matchId, session.uid);
  if (input.parentId) {
    const parent = await findComment(db, input.parentId);
    const thread = await findThread(db, input.matchId);
    if (
      !parent ||
      parent.parentId ||
      parent.threadId !== thread?.id ||
      parent.status !== "visible"
    )
      throw new CommunityError(
        "Responda a um comentário original desta partida.",
      );
  }
  const now = Date.now();
  const id = newId();
  const allowed = activeWriter(session, now);
  await db.batch([
    db
      .insert(threads)
      .select(
        sql`SELECT ${newId()},${input.matchId},'open',0,0,${now},${now} FROM matches WHERE id=${input.matchId} AND deleted_at IS NULL AND ${allowed}`,
      )
      .onConflictDoNothing({ target: threads.matchId }),
    db
      .insert(comments)
      .select(
        sql`SELECT ${id},t.id,${session.uid},${input.parentId ?? null},${input.body},'visible',0,${input.idempotencyKey},${now},${now} FROM threads t JOIN matches m ON m.id=t.match_id
      WHERE m.deleted_at IS NULL AND t.match_id=${input.matchId} AND t.status='open' AND ${allowed}
      AND (${input.parentId ?? null} IS NULL OR EXISTS(SELECT 1 FROM comments p WHERE p.id=${input.parentId ?? null} AND p.thread_id=t.id AND p.parent_id IS NULL AND p.status='visible'))
      AND NOT EXISTS(SELECT 1 FROM comments c WHERE c.thread_id=t.id AND c.author_id=${session.uid} AND c.created_at > ${now} - t.slow_mode_seconds*1000 AND t.slow_mode_seconds>0)`,
      )
      .onConflictDoNothing({
        target: [comments.authorId, comments.idempotencyKey],
      }),
    db
      .update(threads)
      .set({
        commentCount: sql`${threads.commentCount}+1`,
        updatedAt: new Date(now),
      })
      .where(
        sql`match_id=${input.matchId} AND EXISTS(SELECT 1 FROM comments WHERE id=${id})`,
      ),
  ]);
  const [row] = await db
    .select()
    .from(comments)
    .where(
      and(
        eq(comments.authorId, session.uid),
        eq(comments.idempotencyKey, input.idempotencyKey),
      ),
    );
  if (!row) {
    await assertThreadWritable(db, input.matchId, session.uid);
    throw new CommunityError(
      "Não foi possível publicar nesta resenha.",
      "FORBIDDEN",
    );
  }
  return row;
}
export async function reactRecord(
  db: Database,
  session: SessionCookiePayload,
  commentId: string,
) {
  const id = newId();
  const now = Date.now();
  await db.batch([
    db
      .insert(reactions)
      .select(
        sql`SELECT ${id},c.id,${session.uid},${now} FROM comments c JOIN threads t ON t.id=c.thread_id JOIN matches m ON m.id=t.match_id WHERE m.deleted_at IS NULL AND c.id=${commentId} AND c.status='visible' AND t.status='open' AND ${activeWriter(session, now)}`,
      )
      .onConflictDoNothing({ target: [reactions.commentId, reactions.userId] }),
    db
      .update(comments)
      .set({ likeCount: sql`${comments.likeCount}+1` })
      .where(
        sql`id=${commentId} AND EXISTS(SELECT 1 FROM reactions WHERE id=${id})`,
      ),
  ]);
  const [found] = await db
    .select()
    .from(reactions)
    .where(
      and(
        eq(reactions.commentId, commentId),
        eq(reactions.userId, session.uid),
      ),
    );
  if (!found) throw new CommunityError("Não foi possível curtir.", "FORBIDDEN");
}
export async function reportRecord(
  db: Database,
  session: SessionCookiePayload,
  input: { commentId: string; reason: string },
) {
  const now = Date.now();
  await db.run(
    sql`INSERT INTO reports (id,comment_id,reporter_id,reason,status,created_at) SELECT ${newId()},c.id,${session.uid},${input.reason},'open',${now} FROM comments c JOIN threads t ON t.id=c.thread_id JOIN matches m ON m.id=t.match_id WHERE m.deleted_at IS NULL AND c.id=${input.commentId} AND c.status='visible' AND ${activeWriter(session, now, true)} ON CONFLICT(comment_id,reporter_id) DO NOTHING`,
  );
  const [found] = await db
    .select()
    .from(reports)
    .where(
      and(
        eq(reports.commentId, input.commentId),
        eq(reports.reporterId, session.uid),
      ),
    );
  if (!found)
    throw new CommunityError("Não foi possível denunciar.", "FORBIDDEN");
}
export async function readComments(
  db: Database,
  matchId: string,
  rawCursor?: string | null,
) {
  const cursor = decodeCursor(rawCursor);
  const rows = await db
    .select({
      id: comments.id,
      parentId: comments.parentId,
      body: comments.body,
      status: comments.status,
      likeCount: comments.likeCount,
      createdAt: comments.createdAt,
      nickname: users.nickname,
      userStatus: users.status,
    })
    .from(comments)
    .innerJoin(threads, eq(threads.id, comments.threadId))
    .innerJoin(users, eq(users.id, comments.authorId))
    .innerJoin(matches, eq(matches.id, threads.matchId))
    .where(
      and(
        eq(threads.matchId, matchId),
        isNull(matches.deletedAt),
        cursor
          ? or(
              gt(comments.createdAt, new Date(cursor.time)),
              and(
                eq(comments.createdAt, new Date(cursor.time)),
                gt(comments.id, cursor.id),
              ),
            )
          : undefined,
      ),
    )
    .orderBy(asc(comments.createdAt), asc(comments.id))
    .limit(31);
  const items = rows.slice(0, 30).map((row) => ({
    id: row.id,
    parentId: row.parentId,
    nickname:
      row.userStatus === "deleted"
        ? "Torcedor excluído"
        : (row.nickname ?? "Torcedor"),
    body:
      row.status === "hidden"
        ? "Comentário ocultado pela moderação."
        : row.status === "deleted" || row.userStatus === "deleted"
          ? "Removido pelo autor."
          : row.body,
    status: row.userStatus === "deleted" ? "deleted" : row.status,
    likeCount: row.likeCount,
    createdAt: row.createdAt.toISOString(),
  }));
  const last = rows[Math.min(rows.length, 30) - 1];
  const endCursor = last
    ? encodeCursor(last.createdAt.getTime(), last.id)
    : (rawCursor ?? null);
  return { items, nextCursor: rows.length > 30 ? endCursor : null, endCursor };
}
export async function readThreads(db: Database) {
  return db
    .select({
      id: threads.id,
      slug: matches.slug,
      opponentName: matches.opponentName,
      status: threads.status,
      commentCount: threads.commentCount,
      updatedAt: threads.updatedAt,
    })
    .from(threads)
    .innerJoin(matches, eq(matches.id, threads.matchId))
    .where(and(gt(threads.commentCount, 0), isNull(matches.deletedAt)))
    .orderBy(desc(threads.updatedAt))
    .limit(30);
}
