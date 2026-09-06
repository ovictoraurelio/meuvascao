import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const production = process.env.E2E_ENVIRONMENT === "production";

test.describe("F10: Institucionais, SEO e descoberta", () => {
  test("sitemap lista páginas públicas e jogos sem rotas privadas", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.ok()).toBe(true);
    const xml = await response.text();
    expect(xml).toContain("/sobre</loc>");
    expect(xml).toContain("/jogos/vasco-x-adversario-seed</loc>");
    expect(xml).not.toMatch(/\/admin|\/perfil|\/conta|\/entrar|\/dev/);
  });

  test("robots respeita o ambiente", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.ok()).toBe(true);
    const body = await response.text();
    if (production) expect(body).toContain("Allow: /");
    else expect(body).toContain("Disallow: /");
  });

  for (const route of ["/sobre", "/regras-da-resenha", "/privacidade"]) {
    test(`${route} é acessível, versionada e cabe no celular`, async ({
      page,
    }) => {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.getByText(/versão \d{4}-\d{2}-\d{2}/i)).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(page.viewportSize()!.width);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        result.violations.filter(
          (v) => v.impact === "critical" || v.impact === "serious",
        ),
      ).toEqual([]);
    });
  }

  test("captura oferece política antes do consentimento", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator(".captura").getByRole("link", { name: /privacidade/i }),
    ).toHaveAttribute("href", "/privacidade");
  });
});
