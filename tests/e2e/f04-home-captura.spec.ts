import AxeBuilder from "@axe-core/playwright";
import { expect, type Page, test } from "@playwright/test";

// Backlog visível da fatia F4, critério de aceite: docs/01:48 e docs/02:31. Escrito como fixme na
// F1, virado teste de verdade aqui. O seed de E2E (seeds/e2e.sql) já provê os fixtures: um próximo
// jogo, 3 links em "Em 1 minuto", 1 em "Últimas notícias" (com o marcador de XSS) e um lead já
// cadastrado (torcedor@example.com, para o teste de duplicata).
//
// O servidor de teste sempre sobe com esse seed carregado (scripts/db-reset-local.sh, sem
// argumento = "e2e") — não há como testar "banco vazio" nesta mesma suíte sem um segundo servidor
// com outro seed. O que dá para garantir de qualquer forma: nenhuma contagem inventada aparece na
// home mesmo com dados reais. F8 pode criar resenhas em paralelo; o destaque usa dados do banco.
test.describe("F4: Home + captura", () => {
  test("nenhum número inventado aparece na home, mesmo com dados cadastrados", async ({
    page,
  }) => {
    await page.goto("/");
    const html = await page.content();
    expect(html).not.toMatch(
      /\d+\s+(respostas?|curtidas?|reaç(ão|ões)|coment[aá]rios?|torcedores?|seguidores?|visualizaç(ão|ões))/i,
    );
    await expect(page.getByTestId("resenha-destaque")).toBeVisible();
  });

  test("com dados cadastrados, a home mostra jogo, links, resenha e notícias", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByTestId("dia-de-vasco")).toBeVisible();
    await expect(
      page.getByTestId("dia-de-vasco").getByText("Adversário Seed"),
    ).toBeVisible();

    const links = page.getByTestId("em-1-minuto").getByRole("listitem");
    await expect(links).toHaveCount(3);
    for (const link of await links.all()) {
      await expect(link.getByText(/\d{2}\/\d{2}/)).toBeVisible();
      await expect(
        link.getByRole("link", { name: "Ler na fonte" }),
      ).toHaveAttribute("href", /^https:\/\//);
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

  async function preencherEEnviar(page: Page, value: string) {
    await page.goto("/");
    await page.getByLabel("E-mail ou WhatsApp", { exact: true }).fill(value);
    await page.getByLabel(/aceito receber novidades/i).check();
    // A chave de teste do Turnstile aprova sozinha, mas precisa de uma rodada real à Cloudflare
    // antes de preencher o campo escondido — sem isso o envio chega sem token.
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[name="cf-turnstile-response"]',
      );
      return !!el && el.value.length > 0;
    });
    await page.getByRole("button", { name: "Quero receber novidades" }).click();
  }

  test("cadastro de lead válido é aceito e confirmado", async ({
    page,
  }, testInfo) => {
    // Único por execução: "celular" e "desktop" rodam este arquivo contra o mesmo servidor e
    // banco (o webServer é um só para toda a suíte), então um e-mail fixo colidiria como
    // duplicata entre os dois projetos.
    const email = `novo-torcedor-${testInfo.project.name}-${Date.now()}@example.com`;
    await preencherEEnviar(page, email);
    await expect(page.getByText(/cadastro confirmado/i)).toBeVisible();
  });

  test("lead duplicado é rejeitado com mensagem clara", async ({ page }) => {
    await preencherEEnviar(page, "torcedor@example.com");
    await expect(page.getByText(/já está cadastrado/i)).toBeVisible();
  });

  test("lead com e-mail malformado é rejeitado antes do envio", async ({
    page,
  }) => {
    await preencherEEnviar(page, "não-é-um-contato");
    await expect(page.getByText(/e-mail ou telefone válido/i)).toBeVisible();
  });

  test("payload hostil em título de link não executa nem injeta um nó real", async ({
    page,
  }) => {
    const alerts: string[] = [];
    page.on("dialog", (dialog) => {
      alerts.push(dialog.message());
      void dialog.dismiss();
    });
    await page.goto("/");
    expect(alerts).toEqual([]);
    // Astro escapa {link.title} por padrão (sem set:html); o marcador do payload deve aparecer só
    // como texto visível, nunca dentro de um <script> real.
    await expect(page.getByText("Título hostil")).toBeVisible();
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
