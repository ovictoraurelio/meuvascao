import { expect, test } from "@playwright/test";

// Backlog visível da fatia F9 (Moderação), critério de aceite: docs/01:55. Motivo obrigatório ao
// ocultar, 403 de conta suspensa chamando a action diretamente, kill switch e thread fechada são
// verificados no projeto `workers` desta mesma fatia (D1 real), não aqui.
test.describe.fixme("F9: Moderação", () => {
  test("denunciar um comentário, ocultar com motivo e ele some da página", async ({
    page,
  }) => {
    await page.goto("/jogos/vasco-x-adversario-seed");
    await page
      .getByTestId("comentario-seed")
      .getByRole("button", { name: "Denunciar" })
      .click();
    await page.getByLabel("Motivo da denúncia").selectOption("spam");
    await page.getByRole("button", { name: "Enviar denúncia" }).click();
    await expect(page.getByText(/denúncia registrada/i)).toBeVisible();

    await page.goto("/admin/moderacao");
    await page.getByRole("button", { name: "Ocultar" }).first().click();
    await page.getByLabel("Motivo").fill("Spam confirmado");
    await page.getByRole("button", { name: "Confirmar" }).click();

    await page.goto("/jogos/vasco-x-adversario-seed");
    await expect(page.getByTestId("comentario-seed")).toHaveCount(0);
  });

  test("torcedor comum acessando /admin recebe 403 e a página não é indexada", async ({
    page,
    request,
  }) => {
    const direct = await request.get("/admin");
    expect(direct.status()).toBe(403);

    await page.goto("/admin");
    await expect(page.getByText(/acesso não autorizado/i)).toBeVisible();
    const robots = await page
      .locator('meta[name="robots"]')
      .getAttribute("content");
    expect(robots).toContain("noindex");
  });
});
