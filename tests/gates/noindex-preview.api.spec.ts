import { expect, test } from "@playwright/test";

const environment = process.env.E2E_ENVIRONMENT ?? "development";
const production = environment === "production";

// Fora de produção nenhuma resposta pode ser indexada (cabeçalho no Worker e meta robots no HTML,
// porque assets estáticos não passam pelo middleware). Em produção, nenhum dos dois pode existir.
test("indexação respeita o ambiente", async ({ request }) => {
  for (const path of ["/", "/api/health"]) {
    const robots = (await request.get(path)).headers()["x-robots-tag"];
    if (production)
      expect(robots, `${path} com noindex em produção`).toBeUndefined();
    else expect(robots, `${path} sem noindex`).toContain("noindex");
  }
  const html = await (await request.get("/")).text();
  const meta = /<meta name="robots" content="noindex, nofollow"/;
  if (production) expect(html).not.toMatch(meta);
  else expect(html).toMatch(meta);
});

test("cabeçalhos de segurança básicos estão presentes", async ({ request }) => {
  const h = (await request.get("/")).headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["x-request-id"]).toMatch(/^[0-9a-f-]{8,}$/);
});
