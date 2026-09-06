import { env } from "cloudflare:workers";
import { expect, it } from "vitest";
import { getDb } from "@/lib/db/client";
import { comments, reactions, reports } from "@/lib/db/schema";
import { exportOwnCommunityData } from "@/modules/comunidade/account-export.repo";

it("exporta atividade própria sem conteúdo ou identidade privada de terceiros", async () => {
  const db = getDb(env.DB);
  const mine = crypto.randomUUID();
  const theirs = crypto.randomUUID();
  const now = new Date();
  const mineComment = crypto.randomUUID();
  const theirComment = crypto.randomUUID();
  await db.insert(comments).values([
    {
      id: mineComment,
      threadId: "thread-export",
      authorId: mine,
      body: "Meu texto original",
      status: "hidden",
      idempotencyKey: "export-own",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: theirComment,
      threadId: "thread-export",
      authorId: theirs,
      body: "Conteúdo privado de terceiro",
      idempotencyKey: "export-other",
      createdAt: now,
      updatedAt: now,
    },
  ]);
  await db.insert(reactions).values([
    {
      id: crypto.randomUUID(),
      userId: mine,
      commentId: theirComment,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      userId: theirs,
      commentId: mineComment,
      createdAt: now,
    },
  ]);
  await db.insert(reports).values([
    {
      id: crypto.randomUUID(),
      reporterId: mine,
      commentId: theirComment,
      reason: "spam",
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      reporterId: theirs,
      commentId: mineComment,
      reason: "outro",
      createdAt: now,
    },
  ]);
  const result = await exportOwnCommunityData(db, mine);
  expect(result.comentarios).toHaveLength(1);
  expect(result.comentarios[0]?.texto).toBe("Meu texto original");
  expect(result.curtidas).toHaveLength(1);
  expect(result.denuncias).toHaveLength(1);
  expect(result.denuncias[0]?.motivo).toBe("spam");
  const json = JSON.stringify(result);
  expect(json).not.toContain("Conteúdo privado de terceiro");
  expect(json).not.toContain(theirs);
  expect(json).not.toMatch(/idempotency|token|session|hash/i);
  expect(await exportOwnCommunityData(db, "unknown-user")).toEqual({
    comentarios: [],
    curtidas: [],
    denuncias: [],
  });
});
