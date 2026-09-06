import { describe, expect, it } from "vitest";

import { normalizeLeadValue } from "@/modules/curadoria/lead-value-normalize";

describe("normalizeLeadValue", () => {
  it("e-mail: remove espaço nas pontas e vira minúsculo", () => {
    expect(normalizeLeadValue("email", "  Torcedor@Example.com  ")).toBe(
      "torcedor@example.com",
    );
  });

  it("whatsapp: mantém só dígitos", () => {
    expect(normalizeLeadValue("whatsapp", "+55 (21) 99999-9999")).toBe(
      "5521999999999",
    );
  });

  it("whatsapp: formatação diferente do mesmo número (com o mesmo prefixo) normaliza igual", () => {
    expect(normalizeLeadValue("whatsapp", "(21) 99999-9999")).toBe(
      normalizeLeadValue("whatsapp", "21999999999"),
    );
  });

  it("whatsapp: presença ou ausência do DDI produz valores diferentes (não é o mesmo número em texto)", () => {
    expect(normalizeLeadValue("whatsapp", "5521999999999")).not.toBe(
      normalizeLeadValue("whatsapp", "21999999999"),
    );
  });
});
