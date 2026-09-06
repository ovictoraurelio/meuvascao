import { expect, test } from "@playwright/test";

const production = process.env.E2E_ENVIRONMENT === "production";

test("leitura envia proteções e política de transporte do ambiente", async ({
  request,
}) => {
  const response = await request.get("/");
  expect(response.status()).toBe(200);
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response.headers()["x-frame-options"]).toBe("DENY");
  if (production) {
    expect(response.headers()["strict-transport-security"]).toContain(
      "max-age=31536000",
    );
    expect(response.headers()["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(response.headers()["content-security-policy"]).toContain(
      "object-src 'none'",
    );
  } else {
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
    expect(response.headers()["strict-transport-security"]).toBeUndefined();
  }
});

test("rotas de conta não são indexáveis nem cacheáveis", async ({
  request,
}) => {
  for (const path of ["/entrar", "/perfil", "/conta/exportar.json"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.headers()["cache-control"]).toContain("no-store");
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  }
});
