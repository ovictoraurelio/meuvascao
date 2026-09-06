import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Rotas públicas do esqueleto atual. Cada fatia que adiciona uma rota pública (jogos, resenha,
// institucionais) soma-se a esta lista; /perfil e /admin exigem sessão e entram com as fatias que
// as introduzem (F6 e F7), com um teste próprio autenticado.
const PUBLIC_ROUTES = ["/"];

for (const route of PUBLIC_ROUTES) {
  test(`${route} não tem violação de acessibilidade séria ou crítica`, async ({
    page,
  }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
}
