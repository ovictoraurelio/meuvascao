export const MATCH_STATUSES = [
  "agendado",
  "adiado",
  "indefinido",
  "encerrado",
  "cancelado",
] as const;

export type MatchStatus = (typeof MATCH_STATUSES)[number];

/** Só "encerrado" tem placar; é a mesma regra do CHECK de banco em src/lib/db/schema.ts. */
export function requiresScore(status: MatchStatus): boolean {
  return status === "encerrado";
}

export function isCancelled(status: MatchStatus): boolean {
  return status === "cancelado";
}

/** Ainda pode virar o "próximo jogo" da home — não aconteceu nem foi cancelado. */
export function isUpcoming(status: MatchStatus): boolean {
  return (
    status === "agendado" || status === "adiado" || status === "indefinido"
  );
}
