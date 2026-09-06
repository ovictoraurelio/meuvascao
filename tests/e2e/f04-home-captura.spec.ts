import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Backlog visível da fatia F4 (Home + captura), critério de aceite: docs/01:48 e docs/02:31.
// Os títulos foram revisados pelo Product Owner antes da fatia começar (F1). Corpos escritos como
// especificação executável: quando F4 começar, cada `test.fixme` vira `test` e deve passar sem
// precisar reescrever a intenção.
test.describe.fixme("F4: Home + captura", () => {
  test("banco vazio: nenhum número é inventado na home", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    // Nenhuma contagem (respostas, curtidas, torcedores) aparece sem um dado real por trás.
    expect(html).not.toMatch(
      /\d+\s+(respostas?|curtidas?|reaç(ão|ões)|coment[aá]rios?|torcedores?|seguidores?|visualizaç(ão|ões))/i,
    );
    await expect(page.getByText(/ainda não há/i)).toBeVisible();
  });

  test("com dados cadastrados, a home mostra jogo, links, resenha e notícias", async ({
    page,
  }) => {
    // Seed: um próximo jogo, três links em "Em 1 minuto" com fonte e data, uma thread de resenha
    // com comentários, e notícias publicadas.
    await page.goto("/");
    await expect(page.getByTestId("dia-de-vasco")).toBeVisible();
    const links = page.getByTestId("em-1-minuto").getByRole("listitem");
    await expect(links).toHaveCount(3);
    for (const link of await links.all()) {
      await expect(link.getByText(/\d{2}\/\d{2}/)).toBeVisible(); // data
      await expect(link.getByRole("link")).toHaveAttribute(
        "href",
        /^https:\/\//,
      );
    }
    await expect(page.getByTestId("resenha-destaque")).toBeVisible();
    await expect(page.getByTestId("ultimas-noticias")).toBeVisible();
  });

  test("'Ler na fonte' e 'Comentar' são ações distintas no mesmo item", async ({
    page,
  }) => {
    await page.goto("/");
    const item = page.getByTestId("em-1-minuto").getByRole("listitem").first();
    await expect(
      item.getByRole("link", { name: "Ler na fonte" }),
    ).toHaveAttribute("target", "_blank");
    await expect(item.getByRole("link", { name: "Comentar" })).toHaveAttribute(
      "href",
      /^\/jogos\//,
    );
  });

  test("cadastro de lead válido é aceito e confirmado", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("E-mail ou WhatsApp").fill("torcedor@example.com");
    await page.getByLabel(/aceito receber novidades/i).check();
    await page.getByRole("button", { name: "Quero receber novidades" }).click();
    await expect(page.getByText(/cadastro confirmado/i)).toBeVisible();
  });

  test("lead duplicado é rejeitado com mensagem clara", async ({ page }) => {
    // Seed: torcedor@example.com já cadastrado.
    await page.goto("/");
    await page.getByLabel("E-mail ou WhatsApp").fill("torcedor@example.com");
    await page.getByLabel(/aceito receber novidades/i).check();
    await page.getByRole("button", { name: "Quero receber novidades" }).click();
    await expect(page.getByText(/já está cadastrado/i)).toBeVisible();
  });

  test("lead com e-mail malformado é rejeitado antes do envio", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel("E-mail ou WhatsApp").fill("não-é-um-contato");
    await page.getByRole("button", { name: "Quero receber novidades" }).click();
    await expect(page.getByText(/e-mail ou telefone válido/i)).toBeVisible();
  });

  test("payload hostil em título de link ou adversário não executa nem injeta nó", async ({
    page,
  }) => {
    // Seed hostil: título de link curado e nome de adversário com um marcador único (ex.:
    // "seed-xss-marker") dentro de `<script>alert(1)</script>` e de atributos como `onerror`.
    // Não conta todo `<script>` da página (a hidratação do Astro e um JSON-LD legítimo também
    // são `script:not([src])` e dariam falso positivo); procura o marcador especificamente
    // dentro de um nó `<script>` real, o que só aconteceria se o payload tivesse sido montado
    // como HTML em vez de escapado como texto.
    const alerts: string[] = [];
    page.on("dialog", (dialog) => {
      alerts.push(dialog.message());
      void dialog.dismiss();
    });
    await page.goto("/");
    expect(alerts).toEqual([]);
    const injected = await page
      .locator('script:has-text("seed-xss-marker")')
      .count();
    expect(injected).toBe(0);
  });

  test("home populada não tem violação de acessibilidade séria ou crítica", async ({
    page,
  }) => {
    await page.goto("/");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical",
    );
    expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);
  });
});
