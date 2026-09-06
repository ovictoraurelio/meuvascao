import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";

import type { Database } from "@/lib/db/client";
import { assertReturningRow, isUniqueConstraintError } from "@/lib/db/errors";
import { matches } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

import { buildMatchSlug } from "./slug";
import { isUpcoming, MATCH_STATUSES, type MatchStatus } from "./match-state";

const UPCOMING_STATUSES = MATCH_STATUSES.filter(isUpcoming);

export class DuplicateSlugError extends Error {
  readonly slug: string;

  constructor(slug: string) {
    super(`slug de jogo já existe: ${slug}`);
    this.slug = slug;
  }
}

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
  const slug = buildMatchSlug(input.opponentName, id);
  const now = new Date();
  try {
    const [row] = await db
      .insert(matches)
      .values({
        id,
        slug,
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
    return assertReturningRow(row, "jogo");
  } catch (error) {
    // Praticamente impossível (colisão nos 6 caracteres do id que compõem o slug), mas do mesmo
    // jeito que link e lead: uma violação de UNIQUE vira erro de domínio, nunca o erro cru do
    // driver. Um CHECK violado (encerrado sem placar) não é capturado aqui de propósito — é um
    // erro de programação de quem chamou, não um caso de negócio esperado como a duplicata.
    if (isUniqueConstraintError(error)) throw new DuplicateSlugError(slug);
    throw error;
  }
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
        inArray(matches.status, UPCOMING_STATUSES),
      ),
    )
    .orderBy(sql`${matches.kickoffAt} is null`, asc(matches.kickoffAt))
    .limit(1);
  return row ?? null;
}

export interface MatchAgenda {
  upcoming: Match[];
  past: Match[];
}

function compareByKickoff(a: Match, b: Match, direction: 1 | -1): number {
  // Sem horário marcado vai sempre por último, nos dois sentidos — nunca há data para comparar.
  if (a.kickoffAt === null && b.kickoffAt === null) return 0;
  if (a.kickoffAt === null) return 1;
  if (b.kickoffAt === null) return -1;
  return direction * (a.kickoffAt.getTime() - b.kickoffAt.getTime());
}

/**
 * Todos os jogos para a agenda (`/jogos`), divididos em duas listas: os que ainda podem
 * acontecer, do mais próximo ao mais distante (sem horário marcado por último, mesmo critério de
 * findNextMatch); os que já encerraram ou foram cancelados, do mais recente ao mais antigo. Uma
 * única consulta ao D1 (sem paginação, sem filtro de status na própria query) e a divisão/
 * ordenação em memória — o volume esperado (poucos jogos por semana) não justifica duas consultas
 * quase idênticas.
 */
export async function listMatches(db: Database): Promise<MatchAgenda> {
  const rows = await db.select().from(matches).where(isNull(matches.deletedAt));

  const upcoming: Match[] = [];
  const past: Match[] = [];
  for (const row of rows) {
    (isUpcoming(row.status) ? upcoming : past).push(row);
  }

  upcoming.sort((a, b) => compareByKickoff(a, b, 1));
  past.sort((a, b) => compareByKickoff(a, b, -1));

  return { upcoming, past };
}
