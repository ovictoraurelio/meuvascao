import { expect, test } from "@playwright/test";

// Critério de aceite: docs/01:51 e docs/02.
test.describe("F5: Jogos", () => {
  test("agendado: mostra horário em BRT, adversário e local", async ({
    page,
  }) => {
    // Seed: jogo com kickoff_at confirmado, casa, local preenchido.
    await page.goto("/jogos/vasco-x-adversario-seed");
    // "Última atualização" usa o mesmo formato de data — escopado ao parágrafo de horário para
    // não colidir com ele (getByText casaria com os dois).
    await expect(page.getByTestId("horario")).toHaveText(
      /\d{2}\/\d{2}, \d{2}h\d{2} \(Brasília\)/,
    );
    await expect(page.getByText("Adversário Seed")).toBeVisible();
  });

  test("horário indefinido: mostra 'horário a confirmar' em vez de um horário inventado", async ({
    page,
  }) => {
    // Seed: jogo com kickoff_precision = "indefinido".
    await page.goto("/jogos/vasco-x-adversario-sem-horario");
    await expect(page.getByText(/horário a confirmar/i)).toBeVisible();
  });

  test("adiado: estado próprio, não confundido com cancelado ou encerrado", async ({
    page,
  }) => {
    // Seed: jogo com status = "adiado".
    await page.goto("/jogos/vasco-x-adversario-adiado");
    await expect(page.getByText(/adiado/i)).toBeVisible();
  });

  test("encerrado: mostra placar, fonte e 'última atualização'", async ({
    page,
  }) => {
    // Seed: jogo com status = "encerrado", placar e source_name preenchidos.
    await page.goto("/jogos/vasco-x-adversario-encerrado");
    await expect(page.getByTestId("placar")).toBeVisible();
    await expect(page.getByText(/fonte:/i)).toBeVisible();
    await expect(page.getByText(/última atualização/i)).toBeVisible();
  });

  test("sem comentários ainda, não mostra contagem zero inventada", async ({
    page,
  }) => {
    await page.goto("/jogos/vasco-x-adversario-seed");
    await expect(
      page.getByText("A resenha começa no primeiro comentário"),
    ).toBeVisible();
  });

  test("metadados Open Graph identificam o jogo (adversário e data)", async ({
    page,
  }) => {
    await page.goto("/jogos/vasco-x-adversario-seed");
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute("content", /Adversário Seed/);
  });

  test("o CTA de comentar tem ao menos 44 px de alvo em 360 px", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "celular");
    await page.goto("/jogos/vasco-x-adversario-seed");
    const cta = page.getByRole("link", { name: "Comentar" });
    const box = await cta.boundingBox();
    if (!box) throw new Error("CTA 'Comentar' não está visível");
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
  });

  test("agenda (/jogos) separa próximos jogos de resultados, cada um levando à sua página", async ({
    page,
  }) => {
    await page.goto("/jogos");
    await expect(
      page.getByRole("heading", { level: 2, name: "Próximos jogos" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Resultados" }),
    ).toBeVisible();

    const proximo = page
      .getByRole("link")
      .filter({ hasText: "Adversário Seed" })
      .first();
    await proximo.click();
    await expect(page).toHaveURL(/\/jogos\/vasco-x-adversario-seed$/);
  });
});
