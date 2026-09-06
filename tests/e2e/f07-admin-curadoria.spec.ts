import { expect, test } from "@playwright/test";

// Backlog visível da fatia F7 (Administração: agenda e curadoria), critério de aceite: docs/01:56.
test.describe.fixme("F7: Administração — agenda e curadoria", () => {
  test("editor cria um jogo e ele aparece na agenda", async ({ page }) => {
    await page.goto("/admin/jogos");
    await page.getByRole("link", { name: "Novo jogo" }).click();
    await page.getByLabel("Adversário").fill("Time Teste");
    await page.getByLabel("Competição").fill("Brasileirão");
    await page.getByRole("button", { name: "Salvar" }).click();
    await expect(page.getByText("Time Teste")).toBeVisible();
  });

  test("adiar um jogo muda o status sem trocar o slug", async ({ page }) => {
    await page.goto("/admin/jogos/vasco-x-adversario-seed");
    const before = page.url();
    await page.getByRole("button", { name: "Adiar" }).click();
    await page.getByLabel("Motivo").fill("Chuva forte no Rio");
    await page.getByRole("button", { name: "Confirmar" }).click();
    expect(page.url()).toBe(before);
    await expect(page.getByText(/adiado/i)).toBeVisible();
  });

  test("registrar resultado marca o jogo como encerrado", async ({ page }) => {
    await page.goto("/admin/jogos/vasco-x-adversario-seed");
    await page.getByRole("button", { name: "Registrar resultado" }).click();
    await page.getByLabel("Vasco").fill("2");
    await page.getByLabel("Adversário").fill("1");
    await page.getByRole("button", { name: "Salvar resultado" }).click();
    await expect(page.getByText(/encerrado/i)).toBeVisible();
  });

  test("um link curado 'rumor' aparece rotulado como rumor na home", async ({
    page,
  }) => {
    await page.goto("/admin/links");
    await page.getByRole("link", { name: "Novo link" }).click();
    await page.getByLabel("URL").fill("https://exemplo.com/rumor-da-semana");
    await page.getByLabel("Rótulo").selectOption("rumor");
    await page.getByRole("button", { name: "Publicar" }).click();

    await page.goto("/");
    await expect(page.getByText("Rumor")).toBeVisible();
  });

  test("retirar um link some da home imediatamente", async ({ page }) => {
    // Seed: link publicado em "Em 1 minuto".
    await page.goto("/admin/links");
    await page.getByRole("button", { name: "Retirar" }).first().click();
    await page.goto("/");
    await expect(page.getByText("Link Retirado Seed")).toHaveCount(0);
  });

  // O 403 de torcedor comum em toda action admin.*, a geração de audit_log em cada mutação e a
  // estabilidade do slug ao mudar o horário são verificados no projeto `workers` desta mesma
  // fatia (D1 real), não aqui: não dependem de navegador e rodam mais rápido isolados.
});
