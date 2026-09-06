import { and, eq, isNull } from "drizzle-orm";

import type { Database } from "@/lib/db/client";
import { assertReturningRow, isUniqueConstraintError } from "@/lib/db/errors";
import { curatedLinks } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

import { normalizeUrl } from "./url-normalize";

export class DuplicateLinkError extends Error {
  readonly urlNormalized: string;

  constructor(urlNormalized: string) {
    super(`link já cadastrado (URL normalizada): ${urlNormalized}`);
    this.urlNormalized = urlNormalized;
  }
}

export interface CreateLinkInput {
  url: string;
  title: string;
  sourceName: string;
  label: "noticia" | "opiniao" | "rumor" | "video" | "podcast";
  publishedAt?: Date;
  slot: "em1minuto" | "ultimas";
  position: number;
  curatedBy: string;
}

export type CuratedLink = typeof curatedLinks.$inferSelect;

export async function createLink(
  db: Database,
  input: CreateLinkInput,
): Promise<CuratedLink> {
  const urlNormalized = normalizeUrl(input.url);
  const now = new Date();
  try {
    const [row] = await db
      .insert(curatedLinks)
      .values({
        id: newId(),
        url: input.url,
        urlNormalized,
        title: input.title,
        sourceName: input.sourceName,
        label: input.label,
        publishedAt: input.publishedAt,
        slot: input.slot,
        position: input.position,
        status: "publicado",
        curatedBy: input.curatedBy,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return assertReturningRow(row, "link");
  } catch (error) {
    if (isUniqueConstraintError(error))
      throw new DuplicateLinkError(urlNormalized);
    throw error;
  }
}

export async function listPublishedBySlot(
  db: Database,
  slot: "em1minuto" | "ultimas",
): Promise<CuratedLink[]> {
  return db
    .select()
    .from(curatedLinks)
    .where(
      and(
        eq(curatedLinks.status, "publicado"),
        eq(curatedLinks.slot, slot),
        isNull(curatedLinks.deletedAt),
      ),
    )
    .orderBy(curatedLinks.position);
}
