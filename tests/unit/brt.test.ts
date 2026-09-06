import { describe, expect, it } from "vitest";

import { formatBRT } from "@/lib/time/brt";

describe("formatBRT", () => {
  it("formata um instante UTC como horário de Brasília", () => {
    expect(formatBRT(new Date("2026-09-13T21:30:00Z"))).toBe(
      "13/09, 18h30 (Brasília)",
    );
  });

  it("cruza a virada do dia UTC → Brasília (3h antes)", () => {
    // 2026-01-01T02:00:00Z é 2025-12-31T23:00:00 em Brasília.
    expect(formatBRT(new Date("2026-01-01T02:00:00Z"))).toBe(
      "31/12, 23h00 (Brasília)",
    );
  });

  it("preenche hora e minuto de um dígito com zero à esquerda", () => {
    // 2026-03-01T12:05:00Z é 2026-03-01T09:05:00 em Brasília.
    expect(formatBRT(new Date("2026-03-01T12:05:00Z"))).toBe(
      "01/03, 09h05 (Brasília)",
    );
  });
});
