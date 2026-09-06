import { beforeEach, describe, expect, it, vi } from "vitest";

const { bindings } = vi.hoisted(() => ({
  bindings: {
    ENVIRONMENT: "development" as string,
    SITE_URL: "http://localhost:4321",
    TURNSTILE_SITE_KEY: undefined as string | undefined,
    TURNSTILE_SECRET_KEY: undefined as string | undefined,
  },
}));

vi.mock("cloudflare:workers", () => ({ env: bindings }));

import { getTurnstileSiteKey, verifyTurnstileToken } from "@/lib/turnstile";

describe("getTurnstileSiteKey", () => {
  beforeEach(() => {
    bindings.ENVIRONMENT = "development";
    bindings.TURNSTILE_SITE_KEY = undefined;
  });

  it("usa a chave de teste pública quando .dev.vars não define uma", () => {
    expect(getTurnstileSiteKey()).toBe("1x00000000000000000000AA");
  });

  it("usa a chave configurada quando presente", () => {
    bindings.TURNSTILE_SITE_KEY = "chave-real-do-fundador";
    expect(getTurnstileSiteKey()).toBe("chave-real-do-fundador");
  });

  it("acusa em produção se a chave de teste for usada por falta de configuração", () => {
    bindings.ENVIRONMENT = "production";
    const errorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    expect(getTurnstileSiteKey()).toBe("1x00000000000000000000AA");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("TURNSTILE_SITE_KEY"),
    );
    errorSpy.mockRestore();
  });
});

describe("verifyTurnstileToken", () => {
  beforeEach(() => {
    bindings.ENVIRONMENT = "development";
    bindings.TURNSTILE_SECRET_KEY = undefined;
    vi.stubGlobal("fetch", vi.fn());
  });

  it("retorna falso sem chamar a rede quando o token está vazio", async () => {
    const fetchMock = vi.mocked(fetch);
    expect(await verifyTurnstileToken("")).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retorna verdadeiro quando a Cloudflare aprova o token", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: true }), { status: 200 }),
    );
    expect(await verifyTurnstileToken("token-valido")).toBe(true);
  });

  it("retorna falso quando a Cloudflare reprova o token", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: false }), { status: 200 }),
    );
    expect(await verifyTurnstileToken("token-invalido")).toBe(false);
  });

  it("retorna falso quando a chamada à Cloudflare falha", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("", { status: 500 }));
    expect(await verifyTurnstileToken("qualquer-token")).toBe(false);
  });

  it("retorna falso (não lança) quando a chamada de rede falha, não só quando a resposta é ruim", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));
    await expect(verifyTurnstileToken("qualquer-token")).resolves.toBe(false);
  });

  it("envia o secret, o token e o IP como corpo do POST", async () => {
    const fetchMock = vi
      .mocked(fetch)
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );
    await verifyTurnstileToken("token-valido", "203.0.113.42");
    const call = fetchMock.mock.calls[0];
    if (!call) throw new Error("fetch não foi chamado");
    const [url, options] = call;
    expect(url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    const body = options?.body as URLSearchParams;
    expect(body.get("response")).toBe("token-valido");
    expect(body.get("remoteip")).toBe("203.0.113.42");
    expect(body.get("secret")).toBe("1x0000000000000000000000000000000AA");
  });
});
