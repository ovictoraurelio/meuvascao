import { expect, test } from "@playwright/test";

// Backlog visível da fatia F8 (Resenha: comentários por jogo), critério de aceite: docs/01:53-54
// adaptado à decisão do fundador (uma discussão por jogo; sem fórum "Geral" na v1). Idempotência,
// unicidade de reação, corrida de 20 inserções concorrentes e modo lento são verificados no
// projeto `workers` desta mesma fatia (D1 real), não aqui.
test.describe.fixme("F8: Resenha", () => {
  test("duplo clique em publicar não duplica o comentário", async ({
    page,
  }) => {
    await page.goto("/jogos/vasco-x-adversario-seed");
    await page.getByLabel("Seu comentário").fill("Grande jogo do Vasco hoje!");
    const publicar = page.getByRole("button", { name: "Publicar" });
    await Promise.all([publicar.click(), publicar.click()]);
    await expect(page.getByText("Grande jogo do Vasco hoje!")).toHaveCount(1);
  });

  test("payload hostil no corpo do comentário e no apelido não executa", async ({
    page,
  }) => {
    const alerts: string[] = [];
    page.on("dialog", (dialog) => {
      alerts.push(dialog.message());
      void dialog.dismiss();
    });
    // Seed: comentário e apelido com <script> e handlers inline, publicados por seed hostil.
    await page.goto("/jogos/vasco-x-adversario-seed");
    expect(alerts).toEqual([]);
  });

  test("publicar um comentário é possível só com o teclado", async ({
    page,
  }) => {
    await page.goto("/jogos/vasco-x-adversario-seed");
    await page.keyboard.press("Tab");
    await page.getByLabel("Seu comentário").fill("Testando via teclado");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Testando via teclado")).toBeVisible();
  });

  test("comentar sem sessão preserva o rascunho e volta à âncora após o login", async ({
    page,
  }) => {
    await page.goto("/jogos/vasco-x-adversario-seed");
    await page.getByLabel("Seu comentário").fill("Rascunho preservado");
    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page).toHaveURL(/\/entrar/);
    // ... completar o fluxo de login ...
    await expect(page.getByLabel("Seu comentário")).toHaveValue(
      "Rascunho preservado",
    );
  });
});
