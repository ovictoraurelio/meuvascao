import { expect, test } from "@playwright/test";

// O ambiente simulado pelo servidor de testes (ver playwright.config.ts).
const environment = process.env.E2E_ENVIRONMENT ?? "development";

test("saúde responde com ambiente e banco", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect(res.headers()["cache-control"]).toContain("no-store");
  expect(await res.json()).toMatchObject({
    ok: true,
    env: environment,
    db: "ok",
  });
});
