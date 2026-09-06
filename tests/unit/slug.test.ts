import { describe, expect, it } from "vitest";

import { buildMatchSlug } from "@/modules/partidas/slug";

describe("buildMatchSlug", () => {
  it("monta um slug kebab-case a partir do adversário e do id", () => {
    expect(
      buildMatchSlug("Flamengo", "4f8a2b10-0000-0000-0000-000000000000"),
    ).toBe("vasco-x-flamengo-4f8a2b");
  });

  it("remove acentos e caracteres fora de a-z0-9", () => {
    expect(
      buildMatchSlug("São Paulo", "abcdef00-0000-0000-0000-000000000000"),
    ).toBe("vasco-x-sao-paulo-abcdef");
  });

  it("permanece igual depois de editar o horário do jogo (não depende de kickoff_at)", () => {
    const id = "11112222-3333-4444-5555-666677778888";
    const slugAntes = buildMatchSlug("Botafogo", id);
    // Nenhuma chamada leva kickoff_at/status/placar como argumento — o slug não tem como mudar
    // quando esses campos são editados, porque a função nunca os enxerga.
    const slugDepois = buildMatchSlug("Botafogo", id);
    expect(slugDepois).toBe(slugAntes);
  });

  it("dois jogos contra o mesmo adversário (ida e volta) recebem slugs diferentes", () => {
    const ida = buildMatchSlug(
      "Fluminense",
      "aaaa1111-0000-0000-0000-000000000000",
    );
    const volta = buildMatchSlug(
      "Fluminense",
      "bbbb2222-0000-0000-0000-000000000000",
    );
    expect(ida).not.toBe(volta);
  });
});
