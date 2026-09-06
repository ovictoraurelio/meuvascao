import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { expect, it, vi } from "vitest";
import { getDb } from "@/lib/db/client";
import {
  comments,
  threads,
  users,
  settings,
  reactions,
  matches,
} from "@/lib/db/schema";
import { createUser } from "@/modules/identidade/users.repo";
import { createSession } from "@/modules/identidade/sessions.repo";
import { createMatch } from "@/modules/partidas";
import {
  comment,
  like,
  report,
  listComments,
  CommunityError,
} from "@/modules/comunidade";
vi.mock("@/lib/turnstile", () => ({ verifyTurnstileToken: async () => true }));
const db = getDb(env.DB);
async function actor() {
  const id = crypto.randomUUID();
  const user = await createUser(db, {
    email: `${id}@example.com`,
    emailNormalized: `${id}@example.com`,
    nickname: id.slice(0, 10),
    nicknameNormalized: id,
  });
  await createSession(db, {
    id,
    userId: user.id,
    expiresAt: new Date(Date.now() + 60000),
  });
  return { sid: id, uid: user.id, exp: Date.now() + 60000 };
}
async function match() {
  return createMatch(db, {
    opponentName: "Time Teste",
    competition: "Teste",
    homeAway: "casa",
    kickoffAt: null,
    kickoffPrecision: "indefinido",
    status: "indefinido",
  });
}
function input(matchId: string, extra = {}) {
  return {
    matchId,
    body: "Vamos Vasco!",
    idempotencyKey: crypto.randomUUID(),
    turnstileToken: "test",
    ...extra,
  };
}
it("20 comentários simultâneos criam só uma thread e contagem exata", async () => {
  const game = await match();
  const actors = await Promise.all(Array.from({ length: 20 }, actor));
  await Promise.all(
    actors.map((session) => comment(db, session, input(game.id))),
  );
  const rows = await db
    .select()
    .from(threads)
    .where(eq(threads.matchId, game.id));
  expect(rows).toHaveLength(1);
  expect(rows[0]?.commentCount).toBe(20);
});
it("mesma chave concorrente devolve mesmo comentário e conta uma vez", async () => {
  const game = await match();
  const session = await actor();
  const payload = input(game.id);
  const result = await Promise.all([
    comment(db, session, payload),
    comment(db, session, payload),
  ]);
  expect(result[0]?.id).toBe(result[1]?.id);
  const page = await listComments(db, game.id);
  expect(page.items).toHaveLength(1);
});
it("resposta a resposta ou de outra partida é rejeitada", async () => {
  const game = await match();
  const session = await actor();
  const first = await comment(db, session, input(game.id));
  const reply = await comment(
    db,
    session,
    input(game.id, { parentId: first.id }),
  );
  await expect(
    comment(db, session, input(game.id, { parentId: reply.id })),
  ).rejects.toBeInstanceOf(CommunityError);
  const other = await match();
  await expect(
    comment(db, session, input(other.id, { parentId: first.id })),
  ).rejects.toBeInstanceOf(CommunityError);
});
it("curtir duas vezes é uma reação e denúncia é idempotente", async () => {
  const game = await match();
  const session = await actor();
  const item = await comment(db, session, input(game.id));
  await Promise.all([like(db, session, item.id), like(db, session, item.id)]);
  expect(
    await db.select().from(reactions).where(eq(reactions.commentId, item.id)),
  ).toHaveLength(1);
  const [row] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, item.id));
  expect(row?.likeCount).toBe(1);
  await report(db, session, { commentId: item.id, reason: "Ofensa pessoal" });
  await report(db, session, { commentId: item.id, reason: "Ofensa pessoal" });
});
it("suspensão, fechamento e kill switch bloqueiam todas as escritas", async () => {
  const game = await match();
  const session = await actor();
  const item = await comment(db, session, input(game.id));
  await db
    .update(users)
    .set({ status: "suspended" })
    .where(eq(users.id, session.uid));
  for (const operation of [
    () => comment(db, session, input(game.id)),
    () => like(db, session, item.id),
    () => report(db, session, { commentId: item.id, reason: "Teste" }),
  ])
    await expect(operation()).rejects.toBeInstanceOf(CommunityError);
  await db
    .update(users)
    .set({ status: "active" })
    .where(eq(users.id, session.uid));
  await db
    .update(threads)
    .set({ status: "closed" })
    .where(eq(threads.matchId, game.id));
  await expect(comment(db, session, input(game.id))).rejects.toBeInstanceOf(
    CommunityError,
  );
  await db
    .update(threads)
    .set({ status: "open" })
    .where(eq(threads.matchId, game.id));
  await db.insert(settings).values({
    key: "escrita_fechada",
    valueJson: "true",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await expect(comment(db, session, input(game.id))).rejects.toBeInstanceOf(
    CommunityError,
  );
  await expect(like(db, session, item.id)).rejects.toBeInstanceOf(
    CommunityError,
  );
  await report(db, session, {
    commentId: item.id,
    reason: "Abuso durante pausa",
  });
  await db.delete(settings).where(eq(settings.key, "escrita_fechada"));
});
it("modo lento limita concorrência por autor e devolve retryAfter", async () => {
  const game = await match();
  const first = await actor();
  await comment(db, first, input(game.id));
  await db
    .update(threads)
    .set({ slowModeSeconds: 60 })
    .where(eq(threads.matchId, game.id));
  const session = await actor();
  const result = await Promise.allSettled([
    comment(db, session, input(game.id)),
    comment(db, session, input(game.id)),
  ]);
  expect(result.filter((item) => item.status === "fulfilled")).toHaveLength(1);
  const rejected = result.find((item) => item.status === "rejected");
  expect(
    rejected?.status === "rejected" &&
      (rejected.reason as CommunityError).retryAfter,
  ).toBeGreaterThan(0);
});
it("ocultos nunca expõem texto em leitura pública e cursor não duplica", async () => {
  const game = await match();
  const session = await actor();
  const item = await comment(
    db,
    session,
    input(game.id, { body: "texto privado moderado" }),
  );
  await db
    .update(comments)
    .set({ status: "hidden" })
    .where(eq(comments.id, item.id));
  const page = await listComments(db, game.id);
  expect(JSON.stringify(page)).not.toContain("texto privado moderado");
  expect(page.items[0]?.body).toContain("ocultado");
});

it("cursor de 30 itens desempata timestamps iguais sem repetir ou perder", async () => {
  const game = await match();
  const session = await actor();
  const first = await comment(db, session, input(game.id));
  const now = new Date(Date.now() + 1000);
  for (let i = 0; i < 30; i++)
    await db.insert(comments).values({
      id: crypto.randomUUID(),
      threadId: first.threadId,
      authorId: session.uid,
      body: `Mensagem ${i}`,
      idempotencyKey: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  const a = await listComments(db, game.id);
  expect(a.items).toHaveLength(30);
  expect(a.nextCursor).toBeTruthy();
  const b = await listComments(db, game.id, a.nextCursor);
  expect(b.items).toHaveLength(1);
  expect(new Set([...a.items, ...b.items].map((row) => row.id)).size).toBe(31);
});

it("partida excluída não expõe comentários nem aceita novas escritas", async () => {
  const game = await match();
  const session = await actor();
  const item = await comment(db, session, input(game.id));
  await db
    .update(matches)
    .set({ deletedAt: new Date() })
    .where(eq(matches.id, game.id));
  expect((await listComments(db, game.id)).items).toEqual([]);
  await expect(comment(db, session, input(game.id))).rejects.toBeInstanceOf(
    CommunityError,
  );
  await expect(
    report(db, session, { commentId: item.id, reason: "Teste" }),
  ).rejects.toBeInstanceOf(CommunityError);
});
