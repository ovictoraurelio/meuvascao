import { beforeEach, describe, expect, it, vi } from "vitest";

const { bindings } = vi.hoisted(() => ({
  bindings: {
    ENVIRONMENT: "development" as string,
    SITE_URL: "http://localhost:4321",
    SESSION_SECRET: undefined as string | undefined,
  },
}));

vi.mock("cloudflare:workers", () => ({ env: bindings }));

import {
  buildSessionCookieValue,
  newSessionId,
  verifySessionCookieValue,
} from "@/modules/identidade/session";

describe("newSessionId", () => {
  it("gera 64 caracteres hex (32 bytes) e nunca repete", () => {
    const a = newSessionId();
    const b = newSessionId();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe("buildSessionCookieValue / verifySessionCookieValue", () => {
  beforeEach(() => {
    bindings.ENVIRONMENT = "development";
    bindings.SESSION_SECRET = undefined;
  });

  it("confere um cookie recém-criado, com sid e uid preservados", async () => {
    const value = await buildSessionCookieValue("sid-1", "uid-1");
    const payload = await verifySessionCookieValue(value);
    expect(payload?.sid).toBe("sid-1");
    expect(payload?.uid).toBe("uid-1");
  });

  it("rejeita sem lançar quando o valor está ausente", async () => {
    expect(await verifySessionCookieValue(undefined)).toBeNull();
  });

  it("rejeita um valor sem o separador de assinatura", async () => {
    expect(await verifySessionCookieValue("sem-ponto-nenhum")).toBeNull();
  });

  it("rejeita quando o payload foi adulterado (uid trocado)", async () => {
    const value = await buildSessionCookieValue("sid-1", "uid-1");
    const [payloadPart, signaturePart] = value.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        sid: "sid-1",
        uid: "uid-invasor",
        exp: Date.now() + 1000,
      }),
    ).toString("base64url");
    expect(
      await verifySessionCookieValue(`${tamperedPayload}.${signaturePart}`),
    ).toBeNull();
    // sanity: o payload original de fato não é igual ao adulterado
    expect(payloadPart).not.toBe(tamperedPayload);
  });

  it("rejeita quando o cookie já expirou", async () => {
    const value = await buildSessionCookieValue("sid-1", "uid-1");
    vi.useFakeTimers();
    try {
      vi.setSystemTime(Date.now() + 31 * 24 * 60 * 60 * 1000); // 31 dias à frente (max-age é 30)
      expect(await verifySessionCookieValue(value)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("acusa em produção se o segredo de sessão não estiver configurado", async () => {
    bindings.ENVIRONMENT = "production";
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    await buildSessionCookieValue("sid-1", "uid-1");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("SESSION_SECRET"),
    );
    errorSpy.mockRestore();
  });
});
