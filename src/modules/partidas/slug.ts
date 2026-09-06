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
  // Sem isso, um nome vazio ou só com símbolos ("", "  ", "★★★") produziria um slug público
  // quebrado ("vasco-x--4f8a2b") sem nenhum erro — a validação de negócio (Zod, na ação de
  // administração que ainda não existe) fica melhor cedo, mas essa função não deveria conseguir
  // publicar um endereço com esse buraco visível de qualquer jeito.
  if (!opponentSlug) {
    throw new Error(
      `nome de adversário inválido para gerar slug: "${opponentName}"`,
    );
  }
  const suffix = matchId.replace(/-/g, "").slice(0, 6);
  return `vasco-x-${opponentSlug}-${suffix}`;
}
