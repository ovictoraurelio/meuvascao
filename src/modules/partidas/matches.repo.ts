import { and, asc, eq, isNull, or, sql } from "drizzle-orm";

import type { Database } from "@/lib/db/client";
import { matches } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

import { buildMatchSlug } from "./slug";
import type { MatchStatus } from "./match-state";

export interface CreateMatchInput {
  opponentName: string;
  competition: string;
  round?: string;
  homeAway: "casa" | "fora" | "neutro";
  kickoffAt: Date | null;
  kickoffPrecision: "confirmado" | "indefinido";
  venue?: string;
  status: MatchStatus;
  // Só para status "encerrado" — o CHECK de banco (matches_encerrado_tem_placar) rejeita a
  // criação de um jogo assim sem os dois. Registrar o resultado de um jogo já criado, sem
  // placar, é ação da fatia F7 (administração), não desta função.
  scoreVasco?: number;
  scoreOpponent?: number;
  sourceName?: string;
  sourceUrl?: string;
  notes?: string;
  updatedBy?: string;
}

export type Match = typeof matches.$inferSelect;

export async function createMatch(
  db: Database,
  input: CreateMatchInput,
): Promise<Match> {
  const id = newId();
  const now = new Date();
  const [row] = await db
    .insert(matches)
    .values({
      id,
      slug: buildMatchSlug(input.opponentName, id),
      competition: input.competition,
      round: input.round,
      opponentName: input.opponentName,
      homeAway: input.homeAway,
      kickoffAt: input.kickoffAt,
      kickoffPrecision: input.kickoffPrecision,
      venue: input.venue,
      status: input.status,
      scoreVasco: input.scoreVasco,
      scoreOpponent: input.scoreOpponent,
      sourceName: input.sourceName,
      sourceUrl: input.sourceUrl,
      notes: input.notes,
      updatedBy: input.updatedBy,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error("falha ao criar jogo: nenhuma linha retornada");
  return row;
}

export async function findMatchBySlug(
  db: Database,
  slug: string,
): Promise<Match | null> {
  const [row] = await db
    .select()
    .from(matches)
    .where(and(eq(matches.slug, slug), isNull(matches.deletedAt)));
  return row ?? null;
}

/**
 * O próximo jogo para a home: entre os que ainda podem acontecer (agendado/adiado/indefinido),
 * o de kickoff_at mais próximo primeiro; os de horário indefinido (kickoff_at nulo) vão por
 * último, depois de todos os que já têm data marcada.
 */
export async function findNextMatch(db: Database): Promise<Match | null> {
  const [row] = await db
    .select()
    .from(matches)
    .where(
      and(
        isNull(matches.deletedAt),
        or(
          eq(matches.status, "agendado"),
          eq(matches.status, "adiado"),
          eq(matches.status, "indefinido"),
        ),
      ),
    )
    .orderBy(sql`${matches.kickoffAt} is null`, asc(matches.kickoffAt))
    .limit(1);
  return row ?? null;
}
