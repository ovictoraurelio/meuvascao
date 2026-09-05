import { expect, test } from "@playwright/test";

// Fora de produção (desenvolvimento e preview) nenhuma resposta pode ser indexada.
test("respostas fora de produção trazem X-Robots-Tag noindex", async ({
  request,
}) => {
  const health = await request.get("/api/health");
  const { env } = (await health.json()) as { env: string };
  test.skip(env === "production", "em produção o índice é permitido");

  for (const path of ["/", "/api/health"]) {
    const res = await request.get(path);
    expect(res.headers()["x-robots-tag"], `${path} sem noindex`).toContain(
      "noindex",
    );
  }
});

test("cabeçalhos de segurança básicos estão presentes", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
