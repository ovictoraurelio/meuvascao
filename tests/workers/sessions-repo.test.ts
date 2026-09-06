import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { getDb } from "@/lib/db/client";
import {
  createSession,
  findActiveSession,
  revokeAllSessionsForUser,
  revokeSession,
} from "@/modules/identidade/sessions.repo";

describe("sessions.repo", () => {
  const db = getDb(env.DB);

  it("uma sessão recém-criada está ativa", async () => {
    await createSession(db, {
      id: "sessao-1",
      userId: "usuario-1",
      expiresAt: new Date(Date.now() + 60_000),
    });
    expect(await findActiveSession(db, "sessao-1")).not.toBeNull();
  });

  it("uma sessão revogada não é mais ativa", async () => {
    await createSession(db, {
      id: "sessao-2",
      userId: "usuario-1",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await revokeSession(db, "sessao-2");
    expect(await findActiveSession(db, "sessao-2")).toBeNull();
  });

  it("uma sessão expirada não é mais ativa mesmo sem revogação", async () => {
    await createSession(db, {
      id: "sessao-3",
      userId: "usuario-1",
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await findActiveSession(db, "sessao-3")).toBeNull();
  });

  it("revogar todas as sessões de um usuário não afeta a sessão de outro usuário", async () => {
    await createSession(db, {
      id: "sessao-4a",
      userId: "usuario-2",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await createSession(db, {
      id: "sessao-4b",
      userId: "usuario-2",
      expiresAt: new Date(Date.now() + 60_000),
    });
    await createSession(db, {
      id: "sessao-4c",
      userId: "usuario-3",
      expiresAt: new Date(Date.now() + 60_000),
    });

    await revokeAllSessionsForUser(db, "usuario-2");

    expect(await findActiveSession(db, "sessao-4a")).toBeNull();
    expect(await findActiveSession(db, "sessao-4b")).toBeNull();
    expect(await findActiveSession(db, "sessao-4c")).not.toBeNull();
  });

  it("uma sessão inexistente não é ativa", async () => {
    expect(await findActiveSession(db, "nunca-existiu")).toBeNull();
  });
});
