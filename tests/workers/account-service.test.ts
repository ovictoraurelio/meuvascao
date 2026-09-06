import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { getDb } from "@/lib/db/client";
import {
  buildAccountExport,
  chooseNickname,
  deleteOwnAccount,
  getAuthenticatedUser,
  ReservedNicknameError,
  requireNotSuspended,
  SuspendedAccountError,
} from "@/modules/identidade/account.service";
import { DuplicateNicknameError } from "@/modules/identidade/users.repo";
import {
  createSession,
  revokeSession,
} from "@/modules/identidade/sessions.repo";
import { createUser, setNickname } from "@/modules/identidade/users.repo";

describe("account.service: getAuthenticatedUser", () => {
  const db = getDb(env.DB);

  it("retorna sessão e usuário para um cookie válido e ativo", async () => {
    const user = await createUser(db, {
      email: "autenticado@example.com",
      emailNormalized: "autenticado@example.com",
    });
    await createSession(db, {
      id: "sessao-auth-1",
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const result = await getAuthenticatedUser(db, {
      sid: "sessao-auth-1",
      uid: user.id,
      exp: Date.now() + 60_000,
    });
    expect(result?.user.id).toBe(user.id);
  });

  it("retorna nulo sem cookie", async () => {
    expect(await getAuthenticatedUser(db, null)).toBeNull();
  });

  it("retorna nulo quando a sessão foi revogada", async () => {
    const user = await createUser(db, {
      email: "revogado@example.com",
      emailNormalized: "revogado@example.com",
    });
    await createSession(db, {
      id: "sessao-auth-2",
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
    });
    await revokeSession(db, "sessao-auth-2");

    expect(
      await getAuthenticatedUser(db, {
        sid: "sessao-auth-2",
        uid: user.id,
        exp: Date.now() + 60_000,
      }),
    ).toBeNull();
  });

  it("retorna nulo quando o uid do cookie não bate com o dono real da sessão", async () => {
    const user = await createUser(db, {
      email: "dono-real@example.com",
      emailNormalized: "dono-real@example.com",
    });
    await createSession(db, {
      id: "sessao-auth-3",
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
    });

    expect(
      await getAuthenticatedUser(db, {
        sid: "sessao-auth-3",
        uid: "outro-usuario-qualquer",
        exp: Date.now() + 60_000,
      }),
    ).toBeNull();
  });

  it("retorna nulo para uma sessão inexistente", async () => {
    expect(
      await getAuthenticatedUser(db, {
        sid: "nunca-existiu",
        uid: "alguem",
        exp: Date.now() + 60_000,
      }),
    ).toBeNull();
  });
});

describe("account.service: chooseNickname", () => {
  const db = getDb(env.DB);

  it("rejeita um apelido reservado antes mesmo de consultar o banco", async () => {
    const user = await createUser(db, {
      email: "quer-admin@example.com",
      emailNormalized: "quer-admin@example.com",
    });
    await expect(chooseNickname(db, user.id, "Admin")).rejects.toBeInstanceOf(
      ReservedNicknameError,
    );
  });

  it("rejeita um apelido normalizado já em uso", async () => {
    const primeiro = await createUser(db, {
      email: "primeiro-service@example.com",
      emailNormalized: "primeiro-service@example.com",
    });
    await setNickname(db, primeiro.id, "NomeUnico", "nomeunico");

    const segundo = await createUser(db, {
      email: "segundo-service@example.com",
      emailNormalized: "segundo-service@example.com",
    });
    await expect(
      chooseNickname(db, segundo.id, "NomeUnico"),
    ).rejects.toBeInstanceOf(DuplicateNicknameError);
  });

  it("aceita um apelido válido e não reservado", async () => {
    const user = await createUser(db, {
      email: "apelido-valido@example.com",
      emailNormalized: "apelido-valido@example.com",
    });
    const updated = await chooseNickname(db, user.id, "Torcedor Comum");
    expect(updated.nickname).toBe("Torcedor Comum");
  });
});

describe("account.service: requireNotSuspended", () => {
  const db = getDb(env.DB);

  it("não lança para uma conta ativa", async () => {
    const user = await createUser(db, {
      email: "ativo@example.com",
      emailNormalized: "ativo@example.com",
    });
    expect(() => requireNotSuspended(user)).not.toThrow();
  });

  it("lança SuspendedAccountError para uma conta suspensa", async () => {
    const user = await createUser(db, {
      email: "suspenso@example.com",
      emailNormalized: "suspenso@example.com",
    });
    expect(() => requireNotSuspended({ ...user, status: "suspended" })).toThrow(
      SuspendedAccountError,
    );
  });
});

describe("account.service: deleteOwnAccount / buildAccountExport", () => {
  const db = getDb(env.DB);

  it("depois de excluir, getAuthenticatedUser não reconhece mais a sessão", async () => {
    const user = await createUser(db, {
      email: "exclui-e-tenta-usar@example.com",
      emailNormalized: "exclui-e-tenta-usar@example.com",
    });
    await createSession(db, {
      id: "sessao-exclusao",
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await deleteOwnAccount(db, user.id);

    // A sessão em si não foi revogada por deleteOwnAccount (isso é responsabilidade de quem
    // chama, ver src/actions/index.ts) — mas o usuário já está status=deleted, o suficiente para
    // getAuthenticatedUser recusar.
    expect(
      await getAuthenticatedUser(db, {
        sid: "sessao-exclusao",
        uid: user.id,
        exp: Date.now() + 60_000,
      }),
    ).toBeNull();
  });

  it("o export nunca inclui e-mail, hash de token ou HMAC de sessão", () => {
    const user = {
      id: "user-export",
      email: "nao-deveria-aparecer@example.com",
      emailNormalized: "nao-deveria-aparecer@example.com",
      nickname: "Exportador",
      nicknameNormalized: "exportador",
      role: "torcedor" as const,
      status: "active" as const,
      suspendedUntil: null,
      suspendedReason: null,
      privacyVersionAccepted: null,
      createdAt: new Date("2026-01-01T00:00:00Z"),
      updatedAt: new Date("2026-01-01T00:00:00Z"),
      deletedAt: null,
    };
    const exported = buildAccountExport(user);
    expect(exported).toEqual({
      apelido: "Exportador",
      papel: "torcedor",
      criadaEm: "2026-01-01T00:00:00.000Z",
    });
    expect(JSON.stringify(exported)).not.toMatch(/nao-deveria-aparecer/);
  });
});
