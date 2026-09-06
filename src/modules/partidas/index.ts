// Fachada do módulo: pages/actions só importam daqui, nunca de um *.repo.ts diretamente
// (docs/03, "fronteiras" no CLAUDE.md).
export {
  createMatch,
  DuplicateSlugError,
  findMatchBySlug,
  findNextMatch,
  listMatches,
  type CreateMatchInput,
  type Match,
  type MatchAgenda,
} from "./matches.repo";
export {
  isCancelled,
  isUpcoming,
  MATCH_STATUSES,
  requiresScore,
  type MatchStatus,
} from "./match-state";
export { buildMatchSlug } from "./slug";
