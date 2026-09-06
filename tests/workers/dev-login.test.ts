import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { getDb } from "@/lib/db/client";
import { devLogin, devLoginSchema } from "@/modules/identidade/dev-login";
import { findUserByNicknameNormalized } from "@/modules/identidade/users.repo";

describe("devLogin", () => {
  const db = getDb(env.DB);

  it("cria um usuário novo com o papel pedido e abre sessão", async () => {
    const { user, sessionCookieValue } = await devLogin(db, {
      nickname: "editor-dev",
      role: "editor",
    });
    expect(user.role).toBe("editor");
    expect(user.nickname).toBe("editor-dev");
    expect(sessionCookieValue).toMatch(/^[^.]+\.[^.]+$/);
  });

  it("um apelido já usado entra com o usuário existente, ignorando o papel pedido de novo", async () => {
    const primeiro = await devLogin(db, {
      nickname: "moderador-dev",
      role: "moderador",
    });
    const segundo = await devLogin(db, {
      nickname: "moderador-dev",
      role: "torcedor",
    });
    expect(segundo.user.id).toBe(primeiro.user.id);
    expect(segundo.user.role).toBe("moderador");
  });

  it("o schema aplica o papel padrão (torcedor) quando não informado", () => {
    const parsed = devLoginSchema.parse({ nickname: "sem-papel-dev" });
    expect(parsed.role).toBe("torcedor");
  });

  it("usa o papel padrão (torcedor) quando o schema já preencheu o valor", async () => {
    const { user } = await devLogin(
      db,
      devLoginSchema.parse({ nickname: "sem-papel-dev" }),
    );
    expect(user.role).toBe("torcedor");
    const found = await findUserByNicknameNormalized(db, "sem-papel-dev");
    expect(found?.id).toBe(user.id);
  });
});
