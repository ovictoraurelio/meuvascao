import { expect, type Page, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("F7: Administração — agenda e curadoria", () => {
  async function login(page: Page, role = "editor") {
    const response = await page.request.post("/auth/dev-login", {
      headers: { Origin: "http://127.0.0.1:8788" },
      form: {
        nickname: `Equipe${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
        role,
      },
    });
    expect(
      response.ok(),
      `${response.status()} ${await response.text()}`,
    ).toBeTruthy();
  }
  async function createGame(page: Page, name: string) {
    await page.goto("/admin/jogos/novo");
    await page.getByLabel("Adversário", { exact: true }).fill(name);
    await page.getByLabel("Competição").fill("Brasileirão");
    await page.getByLabel("Fonte", { exact: true }).fill("Fonte editorial");
    await page.getByLabel("URL da fonte").fill("https://example.com/agenda");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: `Editar jogo: ${name}`, exact: true }),
    ).toBeVisible();
    return page.url();
  }
  async function createLink(page: Page, name: string) {
    await page.goto("/admin/links/novo");
    await page
      .getByLabel("URL", { exact: true })
      .fill(`https://example.com/${crypto.randomUUID()}`);
    await page.getByLabel("Título").fill(name);
    await page.getByLabel("Fonte", { exact: true }).fill("Fonte editorial");
    await page.getByLabel("Rótulo").selectOption("rumor");
    await page.getByRole("button", { name: "Publicar" }).click();
    await expect(page).toHaveURL(/\/admin\/links$/);
  }
  test.beforeEach(async ({ page }) => login(page));

  test("editor cria um jogo e ele aparece na agenda", async ({
    page,
  }, info) => {
    const name = `Time ${info.project.name} ${Date.now()}`;
    await createGame(page, name);
    await page.goto("/jogos");
    await expect(
      page.getByRole("link", { name: new RegExp(name) }),
    ).toBeVisible();
  });
  test("adiar e editar horário preserva slug; registrar resultado encerra o jogo", async ({
    page,
  }, info) => {
    const before = await createGame(
      page,
      `Adiado ${info.project.name} ${Date.now()}`,
    );
    await page
      .getByRole("combobox", { name: "Estado", exact: true })
      .selectOption("adiado");
    await page.getByLabel("Horário de Brasília").fill("2026-10-15T18:30");
    await page.getByLabel("Observações / motivo").fill("Chuva forte no Rio");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page).toHaveURL(before);
    await expect(
      page.getByText("adiado", { exact: true }).first(),
    ).toBeVisible();
    await page
      .getByRole("combobox", { name: "Estado", exact: true })
      .selectOption("encerrado");
    await page.getByLabel("Placar Vasco").fill("2");
    await page.getByLabel("Placar adversário").fill("1");
    await page.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page).toHaveURL(before);
    await page.getByRole("link", { name: "Página pública" }).click();
    await expect(page.getByText(/2.*1/).first()).toBeVisible();
  });
  test("link humano marcado rumor aparece e retirar o remove", async ({
    page,
  }, info) => {
    const name = `Rumor editorial ${info.project.name} ${Date.now()}`;
    await createLink(page, name);
    await page.goto("/");
    await expect(page.getByText(name, { exact: true })).toBeVisible();
    await page.goto("/admin/links");
    await page
      .getByRole("article")
      .filter({ has: page.getByRole("heading", { name, exact: true }) })
      .getByRole("button", { name: "Retirar" })
      .click();
    await expect(page.getByRole("status")).toContainText("Link retirado");
    await page.goto("/");
    await expect(page.getByText(name, { exact: true })).toHaveCount(0);
  });
  test("torcedor recebe 403 nas páginas e em todas as actions admin", async ({
    page,
  }) => {
    await login(page, "torcedor");
    for (const path of [
      "/admin",
      "/admin/jogos",
      "/admin/links",
      "/admin/leads",
    ]) {
      const response = await page.goto(path);
      expect(response?.status()).toBe(403);
      expect(response?.headers()["x-robots-tag"]).toContain("noindex");
    }
    for (const name of [
      "salvarJogo",
      "publicarLink",
      "retirarLink",
      "exportarLeads",
    ]) {
      const response = await page.request.post(`/_actions/admin.${name}`, {
        multipart: {},
        headers: { Origin: "http://127.0.0.1:8788" },
      });
      expect(response.status()).toBe(403);
    }
  });
  test("admin gera CSV privado e formulários não têm violações sérias", async ({
    page,
  }) => {
    await login(page, "admin");
    for (const path of [
      "/admin/jogos/novo",
      "/admin/links/novo",
      "/admin/leads",
    ]) {
      const response = await page.goto(path);
      expect(response?.headers()["cache-control"]).toContain("no-store");
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        results.violations.filter((item) =>
          ["serious", "critical"].includes(item.impact ?? ""),
        ),
      ).toEqual([]);
    }
    await page.getByRole("button", { name: "Gerar CSV" }).click();
    await expect(
      page.getByRole("link", { name: "Baixar CSV" }),
    ).toHaveAttribute("download", "meuvascao-contatos.csv");
  });
});
