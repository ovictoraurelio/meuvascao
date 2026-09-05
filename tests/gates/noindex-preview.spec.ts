import { expect, test } from "@playwright/test";

// Fora de produção (desenvolvimento e preview) nenhuma resposta pode ser indexada.
test("indexação respeita o ambiente configurado", async ({ request }) => {
  const environment = process.env.E2E_ENVIRONMENT ?? "development";

  for (const path of ["/", "/api/health"]) {
    const res = await request.get(path);
    if (environment === "production") {
      expect(res.headers()["x-robots-tag"]).toBeUndefined();
    } else {
      expect(res.headers()["x-robots-tag"], `${path} sem noindex`).toContain(
        "noindex",
      );
    }
  }
});

test("cabeçalhos de segurança básicos estão presentes", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
