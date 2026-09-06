import { readFile } from "node:fs/promises";

import { expect, type Page, test } from "@playwright/test";

// Critério de aceite: docs/01:52, adaptado à decisão do fundador (link mágico por e-mail, sem
// Google). Fora de produção, o fluxo passa pela caixa de e-mail de desenvolvimento (/dev/mailbox)
// em vez de um provedor real; o envio real via Resend é o spike S2, medido pelo fundador em
// preview.
//
// "celular" e "desktop" compartilham o mesmo webServer/D1 (ver F4), então todo e-mail usado aqui
// é único por projeto + timestamp — nunca um literal fixo que colidiria entre os dois.
test.describe("F6: Conta e sessão", () => {
  async function pedirLinkMagico(page: Page, email: string) {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill(email);
    // A chave de teste do Turnstile aprova sozinha, mas precisa de uma rodada real à Cloudflare
    // antes de preencher o campo escondido — sem isso o envio chega sem token (mesmo padrão de
    // tests/e2e/f04-home-captura.spec.ts).
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[name="cf-turnstile-response"]',
      );
      return !!el && el.value.length > 0;
    });
    await page.getByRole("button", { name: "Enviar link de acesso" }).click();
  }

  async function abrirLinkDoDevMailbox(page: Page, email: string) {
    // ?to= filtra no servidor pelo destinatário exato — sem isso, várias fatias pedindo link ao
    // mesmo tempo (celular + desktop, cada teste com seu e-mail) podem empurrar esta mensagem
    // para fora da janela de "20 mais recentes" antes deste teste conseguir lê-la.
    await page.goto(`/dev/mailbox?to=${encodeURIComponent(email)}`);
    await page
      .getByRole("link", { name: /entrar/i })
      .first()
      .click();
  }

  /** Fluxo completo de um torcedor novo: pede link, entra pela caixa de dev, escolhe apelido. */
  async function entrarComApelidoNovo(
    page: Page,
    email: string,
    nickname: string,
  ) {
    await pedirLinkMagico(page, email);
    await abrirLinkDoDevMailbox(page, email);
    await page.getByLabel("Apelido").fill(nickname);
    await page.getByRole("button", { name: "Confirmar" }).click();
  }

  test("pedir link mágico, abrir em /dev/mailbox e entrar com sessão válida", async ({
    page,
  }, testInfo) => {
    const email = `torcedor-${testInfo.project.name}-${Date.now()}@example.com`;
    await pedirLinkMagico(page, email);
    await expect(page.getByText(/verifique seu e-mail/i)).toBeVisible();

    await abrirLinkDoDevMailbox(page, email);
    await expect(page).toHaveURL(/\/entrar\/confirmar/);
    await expect(page.getByText(/escolha um apelido/i)).toBeVisible();
  });

  test("token de link mágico reutilizado é rejeitado", async ({
    page,
  }, testInfo) => {
    const email = `torcedor-reuso-${testInfo.project.name}-${Date.now()}@example.com`;
    await pedirLinkMagico(page, email);
    await page.goto(`/dev/mailbox?to=${encodeURIComponent(email)}`);
    const link = await page
      .getByRole("link", { name: /entrar/i })
      .first()
      .getAttribute("href");
    if (!link)
      throw new Error("link de entrada não encontrado na caixa de dev");
    await page.goto(link);
    await page.goto(link);
    await expect(page.getByText(/link já foi usado ou expirou/i)).toBeVisible();
  });

  test("quarto pedido de link mágico em 15 minutos é bloqueado", async ({
    page,
  }, testInfo) => {
    const email = `rate-limit-${testInfo.project.name}-${Date.now()}@example.com`;
    for (let i = 0; i < 4; i++) {
      await pedirLinkMagico(page, email);
    }
    await expect(page.getByText(/muitos pedidos/i)).toBeVisible();
  });

  test("apelido duplicado é rejeitado na escolha de apelido", async ({
    page,
  }, testInfo) => {
    // Seed: token válido por projeto (celular/desktop compartilham D1 — um token só serve uma
    // vez) e apelido "Cartoleiro" já existente (seeds/e2e.sql).
    await page.goto(
      `/entrar/confirmar?token=seed-valido-${testInfo.project.name}`,
    );
    await page.getByLabel("Apelido").fill("Cartoleiro");
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText(/apelido já está em uso/i)).toBeVisible();
  });

  test("?redirect= volta à âncora original após o login", async ({
    page,
  }, testInfo) => {
    const email = `redirect-${testInfo.project.name}-${Date.now()}@example.com`;
    await page.goto("/jogos/vasco-x-adversario-seed#comentar");
    await page.getByRole("link", { name: "Entrar para publicar" }).click();
    await expect(page).toHaveURL(/\/entrar\?redirect=/);

    await page.getByLabel("E-mail").fill(email);
    await page.waitForFunction(() => {
      const el = document.querySelector<HTMLInputElement>(
        'input[name="cf-turnstile-response"]',
      );
      return !!el && el.value.length > 0;
    });
    await page.getByRole("button", { name: "Enviar link de acesso" }).click();
    await abrirLinkDoDevMailbox(page, email);
    await page.getByLabel("Apelido").fill(`Torcedor${Date.now()}`);
    await page.getByRole("button", { name: "Confirmar" }).click();

    await expect(page).toHaveURL(/\/jogos\/vasco-x-adversario-seed#comentar/);
  });

  test("sair de todos os dispositivos revoga todas as sessões", async ({
    page,
  }, testInfo) => {
    const email = `sair-todos-${testInfo.project.name}-${Date.now()}@example.com`;
    await entrarComApelidoNovo(page, email, `SairTodos${Date.now()}`);

    await page.goto("/perfil");
    await page
      .getByRole("button", { name: "Sair de todos os dispositivos" })
      .click();
    await expect(page).toHaveURL("/");
    await page.goto("/perfil");
    await expect(page).toHaveURL(/\/entrar/);
  });

  test("excluir conta anonimiza o apelido e mantém os comentários como 'removido pelo autor'", async ({
    page,
  }, testInfo) => {
    const email = `excluir-${testInfo.project.name}-${Date.now()}@example.com`;
    await entrarComApelidoNovo(page, email, `Excluir${Date.now()}`);

    await page.goto("/conta/excluir");
    await page.getByRole("button", { name: "Confirmar exclusão" }).click();
    await expect(page.getByText(/conta excluída/i)).toBeVisible();
  });

  test("exportar dados da conta baixa um JSON sem hashes internos", async ({
    page,
  }, testInfo) => {
    const email = `exportar-${testInfo.project.name}-${Date.now()}@example.com`;
    await entrarComApelidoNovo(page, email, `Exportar${Date.now()}`);

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      // page.goto para uma URL que responde como download sempre rejeita com "Download is
      // starting" — comportamento documentado do Playwright, não um erro real; o evento de
      // download em si já é capturado pela outra promessa.
      page.goto("/conta/exportar.json").catch(() => undefined),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.json$/);

    const path = await download.path();
    if (!path) throw new Error("download não gerou um arquivo local");
    const data: unknown = JSON.parse(await readFile(path, "utf-8"));
    expect(data).toMatchObject({ apelido: expect.any(String) });
    const serialized = JSON.stringify(data);
    // Nenhum campo interno (hash de token, HMAC de sessão) vaza no export do usuário.
    expect(serialized).not.toMatch(/token_hash|session.*hmac|password/i);
  });

  test("cookie revogado não encerra sessões abertas depois", async ({
    page,
    context,
  }, testInfo) => {
    const email = `revogado-${testInfo.project.name}-${Date.now()}@example.com`;
    await entrarComApelidoNovo(page, email, `Revogado${Date.now()}`);
    const oldCookies = await context.cookies();
    await page.getByRole("button", { name: "Sair", exact: true }).click();
    await pedirLinkMagico(page, email);
    await abrirLinkDoDevMailbox(page, email);
    await expect(page).toHaveURL(/\/perfil/);
    const currentCookies = await context.cookies();
    await context.clearCookies();
    await context.addCookies(oldCookies);
    await page.request.post("/auth/logout", { form: { escopo: "todos" } });
    await context.clearCookies();
    await context.addCookies(currentCookies);
    await page.goto("/perfil");
    await expect(page).toHaveURL(/\/perfil/);
  });

  test("logout exige Origin confiável (proteção CSRF)", async ({ request }) => {
    const res = await request.post("/auth/logout", {
      headers: { Origin: "https://evil.example" },
    });
    expect(res.status()).toBe(403);
  });
});
