import type { APIContext } from "astro";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Teste em Node com `cloudflare:workers` simulado: cobre o caminho sem banco, que o E2E
// (sempre com D1 ligado) não alcança. O comportamento com D1 real fica em tests/workers.

const { bindings, first } = vi.hoisted(() => ({
  bindings: {
    ENVIRONMENT: "development",
    SITE_URL: "http://localhost:4321",
    DB: undefined as unknown,
  },
  first: vi.fn(),
}));

vi.mock("cloudflare:workers", () => ({ env: bindings }));

import { GET } from "../../src/pages/api/health";

describe("sonda de saúde", () => {
  beforeEach(() => {
    first.mockReset();
    bindings.DB = { prepare: () => ({ first }) };
  });

  async function probe() {
    return GET({ locals: { requestId: "test-id" } } as APIContext);
  }

  it("retorna 200 quando o banco responde", async () => {
    first.mockResolvedValue({ "1": 1 });
    const response = await probe();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      ok: true,
      db: "ok",
      requestId: "test-id",
    });
  });

  it("retorna 503 quando o binding do banco está ausente", async () => {
    bindings.DB = undefined;
    const response = await probe();
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, db: "error" });
  });

  it("retorna 503 sem expor detalhes internos da falha", async () => {
    first.mockRejectedValue(new Error("detalhe interno do banco"));
    const response = await probe();
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      ok: false,
      db: "error",
      env: "development",
      requestId: "test-id",
    });
  });
});
