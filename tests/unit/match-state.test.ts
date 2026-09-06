import { describe, expect, it } from "vitest";

import {
  isCancelled,
  isUpcoming,
  MATCH_STATUSES,
  requiresScore,
  type MatchStatus,
} from "@/modules/partidas/match-state";

describe("match-state: todos os estados", () => {
  it("cada estado cai em exatamente uma das três classificações (upcoming, encerrado, cancelado)", () => {
    for (const status of MATCH_STATUSES) {
      const classifications = [
        isUpcoming(status),
        requiresScore(status),
        isCancelled(status),
      ].filter(Boolean);
      expect(classifications, `estado "${status}"`).toHaveLength(1);
    }
  });

  it.each(MATCH_STATUSES)(
    "estado %s tem uma classificação estável",
    (status) => {
      const status2: MatchStatus = status;
      expect(isUpcoming(status2)).toBe(isUpcoming(status));
      expect(requiresScore(status2)).toBe(requiresScore(status));
      expect(isCancelled(status2)).toBe(isCancelled(status));
    },
  );

  it("agendado, adiado e indefinido são upcoming; encerrado e cancelado não são", () => {
    expect(isUpcoming("agendado")).toBe(true);
    expect(isUpcoming("adiado")).toBe(true);
    expect(isUpcoming("indefinido")).toBe(true);
    expect(isUpcoming("encerrado")).toBe(false);
    expect(isUpcoming("cancelado")).toBe(false);
  });

  it("só encerrado exige placar", () => {
    for (const status of MATCH_STATUSES) {
      expect(requiresScore(status)).toBe(status === "encerrado");
    }
  });
});
