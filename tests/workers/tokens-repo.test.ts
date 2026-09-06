import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { getDb } from "@/lib/db/client";
import {
  consumeAuthToken,
  countRecentTokensByEmail,
  countRecentTokensByIpHash,
  createAuthToken,
} from "@/modules/identidade/tokens.repo";

describe("tokens.repo", () => {
  const db = getDb(env.DB);

  it("consome um token válido uma única vez", async () => {
    await createAuthToken(db, {
      emailNormalized: "torcedor@example.com",
      tokenHash: "hash-valido-1",
      expiresAt: new Date(Date.now() + 60_000),
    });

    const first = await consumeAuthToken(db, "hash-valido-1");
    expect(first?.emailNormalized).toBe("torcedor@example.com");

    const second = await consumeAuthToken(db, "hash-valido-1");
    expect(second).toBeNull();
  });

  it("duas tentativas concorrentes com o mesmo token: só uma consome", async () => {
    await createAuthToken(db, {
      emailNormalized: "concorrente@example.com",
      tokenHash: "hash-concorrente",
      expiresAt: new Date(Date.now() + 60_000),
    });

    const [a, b] = await Promise.all([
      consumeAuthToken(db, "hash-concorrente"),
      consumeAuthToken(db, "hash-concorrente"),
    ]);
    const successes = [a, b].filter((result) => result !== null);
    expect(successes).toHaveLength(1);
  });

  it("um token expirado não é consumido", async () => {
    await createAuthToken(db, {
      emailNormalized: "expirado@example.com",
      tokenHash: "hash-expirado",
      expiresAt: new Date(Date.now() - 1000),
    });
    expect(await consumeAuthToken(db, "hash-expirado")).toBeNull();
  });

  it("um hash desconhecido não é consumido", async () => {
    expect(await consumeAuthToken(db, "hash-nunca-existiu")).toBeNull();
  });

  it("conta pedidos recentes por e-mail e por IP, cada um isoladamente", async () => {
    const since = new Date(Date.now() - 60_000);
    for (let i = 0; i < 3; i++) {
      await createAuthToken(db, {
        emailNormalized: "muitos-pedidos@example.com",
        tokenHash: `hash-contagem-email-${i}`,
        expiresAt: new Date(Date.now() + 60_000),
        ipHash: "ip-hash-a",
      });
    }
    await createAuthToken(db, {
      emailNormalized: "outro-email@example.com",
      tokenHash: "hash-contagem-outro-email",
      expiresAt: new Date(Date.now() + 60_000),
      ipHash: "ip-hash-a",
    });

    expect(
      await countRecentTokensByEmail(db, "muitos-pedidos@example.com", since),
    ).toBe(3);
    // O mesmo ip_hash apareceu nos 4 tokens criados (3 + 1 de outro e-mail).
    expect(await countRecentTokensByIpHash(db, "ip-hash-a", since)).toBe(4);
  });
});

describe("reserva de envio concorrente", () => {
  it("respeita três tokens por e-mail mesmo com dez pedidos simultâneos", async () => {
    const { reserveAuthToken } =
      await import("@/modules/identidade/tokens.repo");
    const db = getDb(env.DB);
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        reserveAuthToken(
          db,
          {
            emailNormalized: "limite-concorrente@example.com",
            tokenHash: `reserva-${i}`,
            expiresAt: new Date(Date.now() + 60000),
          },
          false,
        ),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(3);
  });
  it("respeita dez tokens por IP entre e-mails diferentes", async () => {
    const { reserveAuthToken } =
      await import("@/modules/identidade/tokens.repo");
    const db = getDb(env.DB);
    const results = await Promise.all(
      Array.from({ length: 15 }, (_, i) =>
        reserveAuthToken(
          db,
          {
            emailNormalized: `limite-ip-${i}@example.com`,
            tokenHash: `reserva-ip-${i}`,
            ipHash: "mesmo-ip-concorrente",
            expiresAt: new Date(Date.now() + 60000),
          },
          true,
        ),
      ),
    );
    expect(results.filter(Boolean)).toHaveLength(10);
  });
});
