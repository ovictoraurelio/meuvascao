import { expect, test } from "@playwright/test";

// Backlog visível da fatia F6 (Conta e sessão via link mágico), critério de aceite: docs/01:52
// adaptado à decisão do fundador (link mágico por e-mail, sem Google). Fora de produção, o fluxo
// passa pela caixa de e-mail de desenvolvimento (/dev/mailbox) em vez de um provedor real; o
// envio real via Resend é o spike S2, medido pelo fundador em preview.
test.describe.fixme("F6: Conta e sessão", () => {
  test("pedir link mágico, abrir em /dev/mailbox e entrar com sessão válida", async ({
    page,
  }) => {
    await page.goto("/entrar");
    await page.getByLabel("E-mail").fill("torcedor@example.com");
    await page.getByRole("button", { name: "Enviar link de acesso" }).click();
    await expect(page.getByText(/verifique seu e-mail/i)).toBeVisible();

    await page.goto("/dev/mailbox");
    await page
      .getByRole("link", { name: /entrar/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/entrar\/confirmar/);
    await expect(page.getByText(/escolha um apelido/i)).toBeVisible();
  });

  test("token de link mágico reutilizado é rejeitado", async ({ page }) => {
    // Fluxo: usar o link uma vez (sessão criada), guardar a URL, tentar de novo.
    await page.goto("/dev/mailbox");
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
  }) => {
    await page.goto("/entrar");
    for (let i = 0; i < 4; i++) {
      await page.getByLabel("E-mail").fill("mesmo-email@example.com");
      await page.getByRole("button", { name: "Enviar link de acesso" }).click();
    }
    await expect(page.getByText(/muitos pedidos/i)).toBeVisible();
  });

  test("apelido duplicado é rejeitado na escolha de apelido", async ({
    page,
  }) => {
    // Seed: apelido "Cartoleiro" já existe.
    await page.goto("/entrar/confirmar?token=seed-valido");
    await page.getByLabel("Apelido").fill("Cartoleiro");
    await page.getByRole("button", { name: "Confirmar" }).click();
    await expect(page.getByText(/apelido já está em uso/i)).toBeVisible();
  });

  test("?redirect= volta à âncora original após o login", async ({ page }) => {
    await page.goto("/jogos/vasco-x-adversario-seed#comentar");
    await page.getByRole("link", { name: "Comentar" }).click();
    await expect(page).toHaveURL(/\/entrar\?redirect=/);
    // ... completar o fluxo de login ...
    await expect(page).toHaveURL(/\/jogos\/vasco-x-adversario-seed#comentar/);
  });

  test("sair de todos os dispositivos revoga todas as sessões", async ({
    page,
  }) => {
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
  }) => {
    await page.goto("/conta/excluir");
    await page.getByRole("button", { name: "Confirmar exclusão" }).click();
    await expect(page.getByText(/conta excluída/i)).toBeVisible();
  });

  test("exportar dados da conta baixa um JSON sem hashes internos", async ({
    page,
  }) => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.goto("/conta/exportar.json"),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.json$/);
  });

  test("logout exige Origin confiável (proteção CSRF)", async ({ request }) => {
    const res = await request.post("/auth/logout", {
      headers: { Origin: "https://evil.example" },
    });
    expect(res.status()).toBe(403);
  });
});
