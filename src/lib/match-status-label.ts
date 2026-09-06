export type MatchStatusValue =
  "agendado" | "adiado" | "indefinido" | "encerrado" | "cancelado";

/**
 * Rótulo visível para o status do jogo; string vazia quando o status não precisa de destaque
 * (agendado e indefinido já são o padrão esperado, não uma exceção a sinalizar). Fonte única
 * compartilhada por componentes e páginas — nenhum dos dois importa @/modules/partidas.
 */
export const MATCH_STATUS_LABEL: Record<MatchStatusValue, string> = {
  agendado: "",
  adiado: "Adiado",
  indefinido: "",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};
