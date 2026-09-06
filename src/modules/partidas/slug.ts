// Slug estável mesmo depois de editar o horário: depende só do adversário e do id do jogo (gerado
// uma vez na criação), nunca de kickoff_at/status/placar. Dois jogos contra o mesmo adversário na
// mesma competição (ida e volta, por exemplo) recebem sufixos diferentes porque cada um tem um id
// próprio.
function slugifyOpponent(opponentName: string): string {
  return (
    opponentName
      .normalize("NFKD")
      // Marcas diacríticas combinantes que a normalização NFKD separou (ex.: "ã" -> "a" + til).
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

export function buildMatchSlug(opponentName: string, matchId: string): string {
  const opponentSlug = slugifyOpponent(opponentName);
  const suffix = matchId.replace(/-/g, "").slice(0, 6);
  return `vasco-x-${opponentSlug}-${suffix}`;
}
