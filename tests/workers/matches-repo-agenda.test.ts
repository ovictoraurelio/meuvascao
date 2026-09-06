import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { getDb } from "@/lib/db/client";
import { createMatch, listMatches } from "@/modules/partidas/matches.repo";

describe("matches.repo: agenda (listMatches)", () => {
  const db = getDb(env.DB);

  it("sem nenhum jogo, retorna as duas listas vazias", async () => {
    expect(await listMatches(db)).toEqual({ upcoming: [], past: [] });
  });

  it("separa futuros (mais próximo primeiro) de encerrados/cancelados (mais recente primeiro)", async () => {
    const maisLonge = await createMatch(db, {
      opponentName: "Mais Longe FC",
      competition: "Brasileirão",
      homeAway: "fora",
      kickoffAt: new Date("2026-03-01T18:00:00Z"),
      kickoffPrecision: "confirmado",
      status: "agendado",
    });
    const proximo = await createMatch(db, {
      opponentName: "Mais Perto FC",
      competition: "Brasileirão",
      homeAway: "casa",
      kickoffAt: new Date("2026-02-01T18:00:00Z"),
      kickoffPrecision: "confirmado",
      status: "agendado",
    });
    const semData = await createMatch(db, {
      opponentName: "Sem Data FC",
      competition: "Copa",
      homeAway: "neutro",
      kickoffAt: null,
      kickoffPrecision: "indefinido",
      status: "indefinido",
    });
    const recente = await createMatch(db, {
      opponentName: "Recente FC",
      competition: "Brasileirão",
      homeAway: "casa",
      kickoffAt: new Date("2026-01-10T18:00:00Z"),
      kickoffPrecision: "confirmado",
      status: "encerrado",
      scoreVasco: 2,
      scoreOpponent: 1,
    });
    const antigo = await createMatch(db, {
      opponentName: "Antigo FC",
      competition: "Brasileirão",
      homeAway: "fora",
      kickoffAt: new Date("2026-01-01T18:00:00Z"),
      kickoffPrecision: "confirmado",
      status: "encerrado",
      scoreVasco: 0,
      scoreOpponent: 0,
    });

    const { upcoming, past } = await listMatches(db);

    expect(upcoming.map((m) => m.id)).toEqual([
      proximo.id,
      maisLonge.id,
      semData.id,
    ]);
    expect(past.map((m) => m.id)).toEqual([recente.id, antigo.id]);
  });
});
