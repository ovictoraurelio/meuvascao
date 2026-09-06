import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import { auditLog, users } from "@/lib/db/schema";
import { createUser } from "@/modules/identidade/users.repo";
import {
  createSession,
  revokeSession,
} from "@/modules/identidade/sessions.repo";
import {
  saveMatch,
  saveLink,
  withdrawLink,
  exportLeads,
  requireRole,
} from "@/modules/administracao";

const db = getDb(env.DB);
async function actor(role: "editor" | "admin" | "torcedor" = "editor") {
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
const game = {
  opponentName: "Time Teste",
  competition: "Brasileirão",
  homeAway: "casa",
  status: "indefinido",
  kickoffAt: "",
  sourceName: "Fonte humana",
  sourceUrl: "https://example.com/agenda",
};
const link = {
  url: "https://example.com/f7",
  title: "Uma notícia",
  sourceName: "Fonte humana",
  label: "rumor",
  slot: "ultimas",
  position: 1,
};

describe("administração autorizada e auditada", () => {
  it("nega toda mutação/exportação ao torcedor, anônimo, suspenso e sessão revogada", async () => {
    const fan = await actor("torcedor");
    for (const session of [fan, null]) {
      await expect(saveMatch(db, session, game)).rejects.toThrow();
      await expect(saveLink(db, session, link)).rejects.toThrow();
      await expect(
        withdrawLink(db, session, crypto.randomUUID()),
      ).rejects.toThrow();
      await expect(exportLeads(db, session)).rejects.toThrow();
    }
    const editor = await actor();
    await db
      .update(users)
      .set({ status: "suspended" })
      .where(eq(users.id, editor.uid));
    await expect(
      requireRole(db, editor, ["editor", "admin"]),
    ).rejects.toThrow();
    const revoked = await actor();
    await revokeSession(db, revoked.sid);
    await expect(
      requireRole(db, revoked, ["editor", "admin"]),
    ).rejects.toThrow();
  });
  it("cria, adia e registra resultado sem mudar slug; todas as escritas geram audit", async () => {
    const editor = await actor();
    const created = await saveMatch(db, editor, game);
    const delayed = await saveMatch(db, editor, {
      ...game,
      id: created.id,
      status: "adiado",
      notes: "Chuva",
      kickoffAt: "2026-10-01T20:00",
    });
    const ended = await saveMatch(db, editor, {
      ...game,
      id: created.id,
      status: "encerrado",
      scoreVasco: 2,
      scoreOpponent: 1,
    });
    expect(delayed.slug).toBe(created.slug);
    expect(ended.slug).toBe(created.slug);
    expect(ended.scoreVasco).toBe(2);
    const audits = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.targetId, created.id));
    expect(audits).toHaveLength(3);
    expect(audits.every((a) => a.actorId === editor.uid && !!a.afterJson)).toBe(
      true,
    );
    expect(audits.filter((a) => a.beforeJson)).toHaveLength(2);
  });
  it("não aceita resultado sem placar nem URL insegura", async () => {
    const editor = await actor();
    await expect(
      saveMatch(db, editor, { ...game, status: "encerrado" }),
    ).rejects.toThrow();
    await expect(
      saveMatch(db, editor, { ...game, kickoffAt: "2026-02-31T20:00" }),
    ).rejects.toThrow();
    await expect(
      saveLink(db, editor, { ...link, url: "javascript:alert(1)" }),
    ).rejects.toThrow();
  });
  it("publica e retira link com auditoria no mesmo batch", async () => {
    const editor = await actor();
    const created = await saveLink(db, editor, link);
    const removed = await withdrawLink(db, editor, created.id);
    expect(removed.status).toBe("retirado");
    expect(
      await db.select().from(auditLog).where(eq(auditLog.targetId, created.id)),
    ).toHaveLength(2);
  });
  it("exportação é exclusiva de admin e registrada sem contatos no audit", async () => {
    await expect(exportLeads(db, await actor())).rejects.toThrow();
    const admin = await actor("admin");
    const csv = await exportLeads(db, admin);
    expect(csv).toContain("canal,contato,origem,consentimento");
    const audit = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.actorId, admin.uid));
    expect(audit[0]?.action).toBe("lead.export");
    expect(audit[0]?.afterJson).not.toContain("@example.com");
  });
});
