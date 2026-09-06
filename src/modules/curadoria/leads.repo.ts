import { isUniqueConstraintError } from "@/lib/db/errors";
import type { Database } from "@/lib/db/client";
import { leads } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

import { normalizeLeadValue, type LeadChannel } from "./lead-value-normalize";

export class DuplicateLeadError extends Error {
  constructor(public readonly valueNormalized: string) {
    super(`contato já cadastrado: ${valueNormalized}`);
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
    if (!row) throw new Error("falha ao criar lead: nenhuma linha retornada");
    return row;
  } catch (error) {
    if (isUniqueConstraintError(error))
      throw new DuplicateLeadError(valueNormalized);
    throw error;
  }
}
