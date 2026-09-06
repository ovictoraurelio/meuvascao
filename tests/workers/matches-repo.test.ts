import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { getDb } from "@/lib/db/client";
import { isCheckConstraintError } from "@/lib/db/errors";
import { createMatch, findNextMatch } from "@/modules/partidas/matches.repo";

// D1 é compartilhado entre os `it()` deste arquivo (só é reaplicado do zero por arquivo, ver
// tests/workers/setup.ts) — cada teste parte do estado deixado pelo anterior, por isso a ordem
// importa e o caso "sem nenhum jogo" vem primeiro, antes de qualquer criação.
describe("matches.repo: próximo jogo por kickoff_at", () => {
  const db = getDb(env.DB);

  it("retorna null quando não há nenhum jogo futuro", async () => {
    expect(await findNextMatch(db)).toBeNull();
  });

  it("escolhe o agendado mais próximo, ignorando o já encerrado e o cancelado", async () => {
    await createMatch(db, {
      opponentName: "Encerrado FC",
      competition: "Brasileirão",
      homeAway: "casa",
      kickoffAt: new Date("2026-01-01T18:00:00Z"),
      kickoffPrecision: "confirmado",
      status: "encerrado",
      scoreVasco: 2,
      scoreOpponent: 1,
    });
    await createMatch(db, {
      opponentName: "Cancelado FC",
      competition: "Brasileirão",
      homeAway: "casa",
      kickoffAt: new Date("2026-01-05T18:00:00Z"),
      kickoffPrecision: "confirmado",
      status: "cancelado",
    });
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

    const next = await findNextMatch(db);
    expect(next?.id).toBe(proximo.id);
    expect(next?.id).not.toBe(maisLonge.id);
  });

  it("um jogo de horário indefinido só é o próximo enquanto não houver nenhum com data marcada", async () => {
    // Continuando do teste anterior: já existe um "agendado" com kickoff_at em 2026-02-01.
    const indefinido = await createMatch(db, {
      opponentName: "Sem Data FC",
      competition: "Copa",
      homeAway: "neutro",
      kickoffAt: null,
      kickoffPrecision: "indefinido",
      status: "indefinido",
    });
    // O jogo com data marcada de fevereiro continua mais próximo que o de horário indefinido.
    expect((await findNextMatch(db))?.id).not.toBe(indefinido.id);
  });

  it("um CHECK de banco recusa marcar como encerrado sem os dois placares", async () => {
    let caught: unknown;
    try {
      await createMatch(db, {
        opponentName: "Sem Placar FC",
        competition: "Brasileirão",
        homeAway: "casa",
        kickoffAt: new Date("2026-04-01T18:00:00Z"),
        kickoffPrecision: "confirmado",
        status: "encerrado",
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeDefined();
    expect(isCheckConstraintError(caught)).toBe(true);
  });
});
