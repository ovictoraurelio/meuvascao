import { describe, expect, it, vi } from "vitest";

// src/lib/env.ts importa "cloudflare:workers" no topo do módulo — precisa do mock mesmo este
// arquivo só chamando isProduction/isDevelopment com um env explícito (mesmo padrão de
// tests/unit/turnstile.test.ts e tests/unit/session.test.ts).
vi.mock("cloudflare:workers", () => ({
  env: { ENVIRONMENT: "development", SITE_URL: "http://localhost:4321" },
}));

import { isDevelopment, isProduction, publicSignupsEnabled } from "@/lib/env";

// A distinção entre isDevelopment e !isProduction importa de verdade: rotas que nunca podem ser
// alcançáveis fora de uma máquina de desenvolvimento (dev-login, /dev/mailbox) checam
// isDevelopment(), não !isProduction() — preview não é produção, mas é publicamente alcançável
// (wrangler.jsonc: workers_dev true), então "não é produção" sozinho não bastaria para excluí-lo.
describe("isProduction / isDevelopment", () => {
  it("preview não é produção nem desenvolvimento", () => {
    const env = { ENVIRONMENT: "preview" } as Parameters<
      typeof isProduction
    >[0];
    expect(isProduction(env)).toBe(false);
    expect(isDevelopment(env)).toBe(false);
  });

  it("development é desenvolvimento, não produção", () => {
    const env = { ENVIRONMENT: "development" } as Parameters<
      typeof isProduction
    >[0];
    expect(isProduction(env)).toBe(false);
    expect(isDevelopment(env)).toBe(true);
  });

  it("production é produção, não desenvolvimento", () => {
    const env = { ENVIRONMENT: "production" } as Parameters<
      typeof isProduction
    >[0];
    expect(isProduction(env)).toBe(true);
    expect(isDevelopment(env)).toBe(false);
  });
});

describe("publicSignupsEnabled", () => {
  it.each([
    ["development", undefined, true],
    ["preview", undefined, false],
    ["production", undefined, false],
    ["production", "true", true],
    ["development", "false", false],
    ["preview", "invalid", false],
  ])("%s flag=%s returns %s", (environment, flag, expected) => {
    expect(
      publicSignupsEnabled({
        ENVIRONMENT: environment,
        PUBLIC_SIGNUPS_ENABLED: flag,
      } as Env),
    ).toBe(expected);
  });
});
