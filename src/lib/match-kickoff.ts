import { formatBRT } from "@/lib/time/brt";

interface MatchKickoff {
  kickoffPrecision: "confirmado" | "indefinido";
  kickoffAt: Date | null;
}

/**
 * Horário do jogo em BRT quando confirmado; nunca inventa um horário para kickoff indefinido
 * (regra "estados vazios honestos" do CLAUDE.md). Fonte única para componentes e páginas, como
 * MATCH_STATUS_LABEL em @/lib/match-status-label.
 */
export function formatKickoff(match: MatchKickoff): string {
  return match.kickoffPrecision === "confirmado" && match.kickoffAt
    ? formatBRT(match.kickoffAt)
    : "Horário a confirmar";
}
