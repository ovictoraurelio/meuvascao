import { and, eq, gte, sql } from "drizzle-orm";

import { assertReturningRow, isUniqueConstraintError } from "@/lib/db/errors";
import type { Database } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

import { normalizeLeadValue, type LeadChannel } from "./lead-value-normalize";

export class DuplicateLeadError extends Error {
  readonly valueNormalized: string;

  constructor(valueNormalized: string) {
    super(`contato já cadastrado: ${valueNormalized}`);
    this.valueNormalized = valueNormalized;
  }
}

export interface CreateLeadInput {
  channel: LeadChannel;
  value: string;
  sourcePage: string;
  privacyVersion: string;
  ipHash: string;
}

export type Lead = typeof leads.$inferSelect;

export async function createLead(
  db: Database,
  input: CreateLeadInput,
): Promise<Lead> {
  const valueNormalized = normalizeLeadValue(input.channel, input.value);
  const now = new Date();
  try {
    const [row] = await db
      .insert(leads)
      .values({
        id: newId(),
        channel: input.channel,
        value: input.value,
        valueNormalized,
        sourcePage: input.sourcePage,
        privacyVersion: input.privacyVersion,
        consentedAt: now,
        ipHash: input.ipHash,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return assertReturningRow(row, "lead");
  } catch (error) {
    if (isUniqueConstraintError(error))
      throw new DuplicateLeadError(valueNormalized);
    throw error;
  }
}

/** Quantos leads o mesmo IP (hash) cadastrou desde `since` — camada 2 de rate limit (docs/03). */
export async function countRecentByIpHash(
  db: Database,
  ipHash: string,
  since: Date,
): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)` })
    .from(leads)
    .where(and(eq(leads.ipHash, ipHash), gte(leads.createdAt, since)));
  return row?.total ?? 0;
}
