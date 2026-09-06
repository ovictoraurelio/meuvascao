import { expect, test } from "@playwright/test";

// Backlog visível da fatia F10 (Institucionais, SEO e descoberta), critério de aceite: docs/01:57.
// O orçamento de SEO ≥ 0,9 do Lighthouse CI (docs/03) roda como job próprio de CI (@lhci/cli), não
// como teste Playwright; não é repetido aqui.
const environment = process.env.E2E_ENVIRONMENT ?? "development";
const production = environment === "production";

test.describe.fixme("F10: Institucionais, SEO e descoberta", () => {
  test("sitemap.xml lista as rotas públicas e exclui /admin, /perfil e /conta", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    const xml = await res.text();
    expect(xml).toContain("<loc>https://meuvascao.com/</loc>");
    expect(xml).not.toMatch(/\/admin|\/perfil|\/conta/);
  });

  test("robots.txt bloqueia tudo fora de produção e libera em produção", async ({
    request,
  }) => {
    const res = await request.get("/robots.txt");
    const body = await res.text();
    if (production) expect(body).not.toContain("Disallow: /");
    else expect(body).toContain("Disallow: /");
  });

  for (const route of ["/", "/jogos/vasco-x-adversario-seed", "/resenha"]) {
    test(`${route} tem metadados Open Graph completos`, async ({ page }) => {
      await page.goto(route);
      for (const property of ["og:title", "og:description", "og:image"]) {
        await expect(
          page.locator(`meta[property="${property}"]`),
        ).toHaveAttribute("content", /.+/);
      }
    });
  }

  test("página institucional (/regras-da-resenha) mostra a versão da política vigente", async ({
    page,
  }) => {
    await page.goto("/regras-da-resenha");
    await expect(page.getByText(/versão \d{4}-\d{2}-\d{2}/i)).toBeVisible();
  });
});
