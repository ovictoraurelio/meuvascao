import { z } from "zod";
import type { Database } from "@/lib/db/client";
import { communityEnabled } from "@/lib/env";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  getAuthenticatedUser,
  type SessionCookiePayload,
} from "@/modules/identidade";
import {
  assertThreadWritable,
  createCommentRecord,
  findComment,
  reactRecord,
  readComments,
  readThreads,
  reportRecord,
  writingClosed,
} from "./community.repo";
import { CommunityError } from "./errors";
export { CommunityError };
export { findThread, writingClosed } from "./community.repo";
const commentInput = z.object({
  matchId: z.guid(),
  body: z.string().trim().min(1, "Escreva seu comentário.").max(2000),
  parentId: z.guid().optional(),
  idempotencyKey: z.guid(),
  turnstileToken: z.string().min(1),
});
async function writer(
  db: Database,
  session: SessionCookiePayload | null,
  allowDuringPause = false,
) {
  if (!communityEnabled())
    throw new CommunityError(
      "A resenha ainda não está aberta para publicações.",
      "FORBIDDEN",
    );
  const auth = await getAuthenticatedUser(db, session);
  if (!auth || !session)
    throw new CommunityError(
      "Entre para participar da resenha.",
      "UNAUTHORIZED",
    );
  if (auth.user.status !== "active" || !auth.user.nickname)
    throw new CommunityError(
      "Conta sem permissão para publicar. Confira seu perfil.",
      "FORBIDDEN",
    );
  if (!allowDuringPause && (await writingClosed(db)))
    throw new CommunityError(
      "Publicações temporariamente pausadas pela moderação.",
      "FORBIDDEN",
    );
  return session;
}
export async function comment(
  db: Database,
  session: SessionCookiePayload | null,
  raw: unknown,
) {
  const active = await writer(db, session);
  const input = commentInput.parse(raw);
  if (!(await verifyTurnstileToken(input.turnstileToken)))
    throw new CommunityError("Confirme que você não é um robô.", "FORBIDDEN");
  return createCommentRecord(db, active, input);
}
async function commentWriter(
  db: Database,
  session: SessionCookiePayload | null,
  rawId: unknown,
  allowDuringPause = false,
) {
  const active = await writer(db, session, allowDuringPause);
  const id = z.guid().parse(rawId);
  const target = await findComment(db, id);
  if (!target || target.status !== "visible")
    throw new CommunityError("Comentário indisponível.");
  const thread = await findThreadByComment(db, target.threadId);
  if (!allowDuringPause) await assertThreadWritable(db, thread.matchId);
  return { active, id };
}
async function findThreadByComment(db: Database, id: string) {
  const { threadById } = await import("./thread.repo");
  const thread = await threadById(db, id);
  if (!thread) throw new CommunityError("Resenha indisponível.");
  return thread;
}
export async function like(
  db: Database,
  session: SessionCookiePayload | null,
  id: unknown,
) {
  const allowed = await commentWriter(db, session, id);
  await reactRecord(db, allowed.active, allowed.id);
}
export async function report(
  db: Database,
  session: SessionCookiePayload | null,
  raw: unknown,
) {
  const input = z
    .object({ commentId: z.guid(), reason: z.string().trim().min(3).max(500) })
    .parse(raw);
  const allowed = await commentWriter(db, session, input.commentId, true);
  await reportRecord(db, allowed.active, input);
}
export async function listComments(
  db: Database,
  matchId: string,
  cursor?: string | null,
) {
  return readComments(db, z.guid().parse(matchId), cursor);
}
export async function listThreads(db: Database) {
  return readThreads(db);
}
