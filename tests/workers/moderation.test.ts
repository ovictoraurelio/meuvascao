import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { getDb } from "@/lib/db/client";
import {
  auditLog,
  comments,
  reports,
  settings,
  threads,
  users,
} from "@/lib/db/schema";
import { createUser } from "@/modules/identidade/users.repo";
import {
  createSession,
  revokeSession,
} from "@/modules/identidade/sessions.repo";
import {
  hideComment,
  listModeration,
  setUserSuspended,
  setSlowMode,
  setThreadClosed,
  setWritingClosed,
  resolveReport,
} from "@/modules/moderacao";

const db = getDb(env.DB);
async function actor(
  role: "moderador" | "admin" | "torcedor" | "editor" = "moderador",
) {
  const id = crypto.randomUUID();
  const user = await createUser(db, {
    email: `${id}@example.com`,
    emailNormalized: `${id}@example.com`,
    role,
  });
  await createSession(db, {
    id,
    userId: user.id,
    expiresAt: new Date(Date.now() + 60000),
  });
  return { sid: id, uid: user.id, exp: Date.now() + 60000 };
}
async function fixture() {
  const author = await actor("torcedor");
  const threadId = crypto.randomUUID();
  const commentId = crypto.randomUUID();
  const reportId = crypto.randomUUID();
  const now = new Date();
  await db
    .insert(threads)
    .values({
      id: threadId,
      matchId: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  await db
    .insert(comments)
    .values({
      id: commentId,
      threadId,
      authorId: author.uid,
      body: "Texto denunciado",
      idempotencyKey: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  await db
    .insert(reports)
    .values({
      id: reportId,
      commentId,
      reporterId: crypto.randomUUID(),
      reason: "spam",
      createdAt: now,
    });
  return { author, threadId, commentId, reportId };
}

test("todas as operações negam anônimo, torcedor, editor, moderador suspenso e sessão revogada", async () => {
  const suspended = await actor();
  await db
    .update(users)
    .set({ status: "suspended" })
    .where(eq(users.id, suspended.uid));
  const revoked = await actor();
  await revokeSession(db, revoked.sid);
  for (const session of [
    null,
    await actor("torcedor"),
    await actor("editor"),
    suspended,
    revoked,
  ]) {
    await expect(listModeration(db, session)).rejects.toThrow();
    const input = {
      id: crypto.randomUUID(),
      reason: "Motivo informado",
      suspended: true,
      seconds: 60,
      closed: true,
    };
    for (const operation of [
      hideComment,
      setUserSuspended,
      setSlowMode,
      setThreadClosed,
      setWritingClosed,
      resolveReport,
    ])
      await expect(operation(db, session, input)).rejects.toThrow();
  }
});

test("ocultar exige motivo, preserva linha, resolve denúncias e registra auditoria sem copiar corpo", async () => {
  const moderator = await actor();
  const { commentId, reportId } = await fixture();
  await expect(
    hideComment(db, moderator, { id: commentId, reason: "  " }),
  ).rejects.toThrow();
  await hideComment(db, moderator, {
    id: commentId,
    reason: "Spam confirmado",
  });
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId));
  expect(comment?.status).toBe("hidden");
  expect(comment?.body).toBe("Texto denunciado");
  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId));
  expect(report?.status).toBe("resolved");
  expect(report?.resolvedBy).toBe(moderator.uid);
  const [audit] = await db
    .select()
    .from(auditLog)
    .where(eq(auditLog.targetId, commentId));
  expect(audit?.reason).toBe("Spam confirmado");
  expect(audit?.beforeJson).not.toContain("Texto denunciado");
  expect(audit?.afterJson).toContain("hidden");
});

test("suspensão e reativação auditadas; moderador não pune equipe privilegiada ou a si", async () => {
  const moderator = await actor();
  const fan = await actor("torcedor");
  const admin = await actor("admin");
  await setUserSuspended(db, moderator, {
    id: fan.uid,
    suspended: true,
    reason: "Ofensa reiterada",
  });
  const [suspended] = await db
    .select()
    .from(users)
    .where(eq(users.id, fan.uid));
  expect(suspended?.status).toBe("suspended");
  expect(suspended?.suspendedReason).toBe("Ofensa reiterada");
  await setUserSuspended(db, moderator, {
    id: fan.uid,
    suspended: false,
    reason: "Revisão da decisão",
  });
  const [restored] = await db.select().from(users).where(eq(users.id, fan.uid));
  expect(restored?.status).toBe("active");
  expect(restored?.suspendedReason).toBeNull();
  expect(
    await db.select().from(auditLog).where(eq(auditLog.targetId, fan.uid)),
  ).toHaveLength(2);
  await expect(
    setUserSuspended(db, moderator, {
      id: admin.uid,
      suspended: true,
      reason: "Tentativa proibida",
    }),
  ).rejects.toThrow();
  await expect(
    setUserSuspended(db, moderator, {
      id: moderator.uid,
      suspended: true,
      reason: "Tentativa proibida",
    }),
  ).rejects.toThrow();
});

test("modo lento, fechamento e kill switch são reversíveis, limitados e auditados", async () => {
  const moderator = await actor();
  const { threadId } = await fixture();
  await expect(
    setSlowMode(db, moderator, {
      id: threadId,
      seconds: -1,
      reason: "Inválido",
    }),
  ).rejects.toThrow();
  await setSlowMode(db, moderator, {
    id: threadId,
    seconds: 60,
    reason: "Acalmar conversa",
  });
  await setThreadClosed(db, moderator, {
    id: threadId,
    closed: true,
    reason: "Pausa necessária",
  });
  let [thread] = await db
    .select()
    .from(threads)
    .where(eq(threads.id, threadId));
  expect(thread?.slowModeSeconds).toBe(60);
  expect(thread?.status).toBe("closed");
  await setThreadClosed(db, moderator, {
    id: threadId,
    closed: false,
    reason: "Conversa reaberta",
  });
  [thread] = await db.select().from(threads).where(eq(threads.id, threadId));
  expect(thread?.status).toBe("open");
  await setWritingClosed(db, moderator, {
    closed: true,
    reason: "Incidente global",
  });
  let [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "escrita_fechada"));
  expect(setting?.valueJson).toBe("true");
  await setWritingClosed(db, moderator, {
    closed: false,
    reason: "Incidente resolvido",
  });
  [setting] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "escrita_fechada"));
  expect(setting?.valueJson).toBe("false");
  expect(
    await db.select().from(auditLog).where(eq(auditLog.actorId, moderator.uid)),
  ).toHaveLength(5);
});

test("denúncia pode ser encerrada sem ocultar comentário", async () => {
  const moderator = await actor();
  const { commentId, reportId } = await fixture();
  await resolveReport(db, moderator, {
    id: reportId,
    reason: "Conteúdo dentro das regras",
  });
  const [comment] = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId));
  expect(comment?.status).toBe("visible");
  const [report] = await db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId));
  expect(report?.status).toBe("resolved");
});
