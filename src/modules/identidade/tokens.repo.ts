import { and, eq, gte, isNull, sql } from "drizzle-orm";

import type { Database } from "@/lib/db/client";
import { authTokens } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

export interface CreateAuthTokenInput {
  emailNormalized: string;
  tokenHash: string;
  expiresAt: Date;
  ipHash?: string;
  uaHash?: string;
}

export async function createAuthToken(
  db: Database,
  input: CreateAuthTokenInput,
): Promise<void> {
  await db.insert(authTokens).values({
    id: newId(),
    emailNormalized: input.emailNormalized,
    tokenHash: input.tokenHash,
    expiresAt: input.expiresAt,
    ipHash: input.ipHash,
    uaHash: input.uaHash,
    createdAt: new Date(),
  });
}

/**
 * Consome o token de forma atômica: o `UPDATE ... WHERE used_at IS NULL` só afeta a linha se
 * ninguém tiver usado antes — duas tentativas concorrentes com o mesmo token nunca passam as duas.
 * Retorna o e-mail associado só quando o token era válido (existia, não expirou, não foi usado).
 */
export async function consumeAuthToken(
  db: Database,
  tokenHash: string,
): Promise<{ emailNormalized: string } | null> {
  const [row] = await db
    .update(authTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(authTokens.tokenHash, tokenHash),
        isNull(authTokens.usedAt),
        gte(authTokens.expiresAt, new Date()),
      ),
    )
    .returning({ emailNormalized: authTokens.emailNormalized });
  return row ?? null;
}

export async function countRecentTokensByEmail(
  db: Database,
  emailNormalized: string,
  since: Date,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(authTokens)
    .where(
      and(
        eq(authTokens.emailNormalized, emailNormalized),
        gte(authTokens.createdAt, since),
      ),
    );
  return row?.total ?? 0;
}

export async function countRecentTokensByIpHash(
  db: Database,
  ipHash: string,
  since: Date,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(authTokens)
    .where(
      and(eq(authTokens.ipHash, ipHash), gte(authTokens.createdAt, since)),
    );
  return row?.total ?? 0;
}
