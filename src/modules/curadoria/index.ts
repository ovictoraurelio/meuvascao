// Fachada do módulo: pages/actions só importam daqui, nunca de um *.repo.ts diretamente
// (docs/03, "fronteiras" no CLAUDE.md).
export {
  CURRENT_PRIVACY_VERSION,
  HoneypotTrippedError,
  leadInputSchema,
  RateLimitedError,
  registerLead,
  TurnstileFailedError,
  type LeadInput,
} from "./leads.service";
export { DuplicateLeadError, type Lead } from "./leads.repo";
export {
  DuplicateLinkError,
  listPublishedBySlot,
  type CuratedLink,
} from "./links.repo";
