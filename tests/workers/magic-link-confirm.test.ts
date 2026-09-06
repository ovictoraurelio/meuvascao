import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { sha256Hex } from "@/lib/crypto/hash";
import { getDb } from "@/lib/db/client";
import {
  confirmMagicLink,
  InvalidOrExpiredTokenError,
} from "@/modules/identidade/magic-link";
import { createAuthToken } from "@/modules/identidade/tokens.repo";
import { findUserByEmailNormalized } from "@/modules/identidade/users.repo";

// confirmMagicLink não chama o Turnstile (só requestMagicLink chama) — dá para testar em D1 real
// sem mockar fetch. O pedido em si (com Turnstile e rate limit) é coberto pelo E2E
// (tests/e2e/f06-conta-sessao.spec.ts), como já é o caso de leads.service.registerLead.
describe("magic-link: confirmMagicLink", () => {
  const db = getDb(env.DB);

  async function seedToken(emailNormalized: string, plaintext: string) {
    await createAuthToken(db, {
      emailNormalized,
      tokenHash: await sha256Hex(plaintext),
      expiresAt: new Date(Date.now() + 60_000),
    });
  }

  it("cria um usuário novo na primeira confirmação e abre uma sessão", async () => {
    await seedToken("novo@example.com", "token-novo-usuario");
    const { user, sessionCookieValue } = await confirmMagicLink(
      db,
      "token-novo-usuario",
    );
    expect(user.emailNormalized).toBe("novo@example.com");
    expect(user.nickname).toBeNull();
    expect(sessionCookieValue).toMatch(/^[^.]+\.[^.]+$/);

    const found = await findUserByEmailNormalized(db, "novo@example.com");
    expect(found?.id).toBe(user.id);
  });

  it("reaproveita o usuário existente numa segunda confirmação com outro token", async () => {
    await seedToken("recorrente@example.com", "token-primeira-vez");
    const primeira = await confirmMagicLink(db, "token-primeira-vez");

    await seedToken("recorrente@example.com", "token-segunda-vez");
    const segunda = await confirmMagicLink(db, "token-segunda-vez");

    expect(segunda.user.id).toBe(primeira.user.id);
  });

  it("rejeita um token inexistente", async () => {
    await expect(
      confirmMagicLink(db, "token-que-nunca-existiu"),
    ).rejects.toBeInstanceOf(InvalidOrExpiredTokenError);
  });

  it("rejeita um token já consumido", async () => {
    await seedToken("reuso@example.com", "token-reuso");
    await confirmMagicLink(db, "token-reuso");
    await expect(confirmMagicLink(db, "token-reuso")).rejects.toBeInstanceOf(
      InvalidOrExpiredTokenError,
    );
  });

  it("duas confirmações concorrentes do mesmo e-mail novo (dois tokens) resolvem para um único usuário", async () => {
    await seedToken("concorrente@example.com", "token-concorrente-a");
    await seedToken("concorrente@example.com", "token-concorrente-b");

    const [a, b] = await Promise.all([
      confirmMagicLink(db, "token-concorrente-a"),
      confirmMagicLink(db, "token-concorrente-b"),
    ]);
    expect(a.user.id).toBe(b.user.id);
  });

  it("rejeita um token expirado", async () => {
    await createAuthToken(db, {
      emailNormalized: "expirado-confirm@example.com",
      tokenHash: await sha256Hex("token-expirado-confirm"),
      expiresAt: new Date(Date.now() - 1000),
    });
    await expect(
      confirmMagicLink(db, "token-expirado-confirm"),
    ).rejects.toBeInstanceOf(InvalidOrExpiredTokenError);
  });
});
