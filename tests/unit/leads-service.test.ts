import { describe, expect, it, vi } from "vitest";

// leads.service.ts importa verifyTurnstileToken, que importa getEnv, que importa
// "cloudflare:workers" — precisa do mock mesmo este arquivo só testando o schema Zod puro.
vi.mock("cloudflare:workers", () => ({
  env: { ENVIRONMENT: "development", SITE_URL: "http://localhost:4321" },
}));

import { leadInputSchema } from "@/modules/curadoria/leads.service";

function validInput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    channel: "email",
    value: "torcedor@example.com",
    sourcePage: "/",
    consent: true,
    turnstileToken: "token-de-teste",
    ...overrides,
  };
}

describe("leadInputSchema", () => {
  it("aceita um e-mail válido com consentimento", () => {
    expect(leadInputSchema.safeParse(validInput()).success).toBe(true);
  });

  it("aceita um WhatsApp válido com DDD", () => {
    const result = leadInputSchema.safeParse(
      validInput({ channel: "whatsapp", value: "(21) 99999-9999" }),
    );
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail malformado", () => {
    const result = leadInputSchema.safeParse(
      validInput({ value: "não-é-um-email" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejeita WhatsApp sem dígitos suficientes para ter DDD", () => {
    const result = leadInputSchema.safeParse(
      validInput({ channel: "whatsapp", value: "12345" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejeita sem consentimento", () => {
    const result = leadInputSchema.safeParse(validInput({ consent: false }));
    expect(result.success).toBe(false);
  });

  it("rejeita sem o token do Turnstile", () => {
    const result = leadInputSchema.safeParse(
      validInput({ turnstileToken: "" }),
    );
    expect(result.success).toBe(false);
  });

  it("aceita e preserva um honeypot preenchido (a rejeição é do serviço, não da validação)", () => {
    const result = leadInputSchema.safeParse(
      validInput({ honeypot: "sou um robô" }),
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.honeypot).toBe("sou um robô");
  });

  it("honeypot ausente vira string vazia por padrão", () => {
    const result = leadInputSchema.safeParse(validInput());
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.honeypot).toBe("");
  });
});
