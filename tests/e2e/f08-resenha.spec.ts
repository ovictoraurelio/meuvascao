import { expect, type Page, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const origin = () => new URL("/", test.info().project.use.baseURL).origin;
async function login(page: Page, role = "torcedor") {
  const response = await page.request.post("/auth/dev-login", {
    headers: { Origin: origin() },
    form: {
      nickname: `Pessoa${Date.now()}${Math.random().toString(36).slice(2, 5)}`,
      role,
    },
  });
  expect(response.ok()).toBeTruthy();
}
async function game(page: Page) {
  await login(page, "editor");
  await page.goto("/admin/jogos/novo");
  await page
    .getByLabel("Adversário", { exact: true })
    .fill(`Time F8 ${Date.now()}`);
  await page.getByLabel("Competição").fill("Teste");
  await page.getByLabel("Fonte", { exact: true }).fill("Fonte de teste");
  await page.getByLabel("URL da fonte").fill("https://example.com/jogo");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Página pública" }),
  ).toBeVisible();
  const path = await page
    .getByRole("link", { name: "Página pública" })
    .getAttribute("href");
  if (!path) throw new Error("Jogo sem endereço");
  await login(page);
  await page.goto(path);
  return path;
}
async function ready(page: Page) {
  await page.waitForFunction(
    () =>
      !!document.querySelector<HTMLInputElement>(
        '.resenha input[name="cf-turnstile-response"]',
      )?.value,
  );
}
async function publish(page: Page, body: string) {
  await page.getByLabel("Seu comentário").fill(body);
  await ready(page);
  await page.getByRole("button", { name: "Publicar comentário" }).click();
  await expect(page.getByRole("status")).toContainText("Comentário publicado");
}

test.describe("F8: Resenha", () => {
  test("duplo envio com a mesma chave cria um comentário e uma curtida", async ({
    page,
  }) => {
    await game(page);
    await ready(page);
    const payload = await page
      .locator("#resenha-form")
      .evaluate((form) =>
        Object.fromEntries(new FormData(form as HTMLFormElement)),
      );
    payload.body = `Duplo ${Date.now()}`;
    const cookie = (await page.context().cookies())
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    await Promise.all(
      [1, 2].map(() =>
        page.request.post("/_actions/comunidade.comentar", {
          headers: { Origin: origin(), Cookie: cookie },
          multipart: payload as Record<string, string>,
        }),
      ),
    );
    await page.reload();
    await expect(
      page.locator(".corpo").filter({ hasText: payload.body as string }),
    ).toHaveCount(1);
    await page.getByRole("button", { name: "Curtir", exact: true }).click();
    await expect(page.getByText("1 curtida", { exact: true })).toBeVisible();
  });
  test("texto hostil permanece texto, teclado publica, resposta e denúncia funcionam", async ({
    page,
  }) => {
    await game(page);
    const body = '<img src=x onerror="window.__xss=1"> Vasco';
    await page.getByLabel("Seu comentário").fill(body);
    await ready(page);
    await page.getByRole("button", { name: "Publicar comentário" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".corpo")).toHaveText(body);
    expect(await page.evaluate(() => "__xss" in window)).toBe(false);
    await expect(page.locator(".corpo img")).toHaveCount(0);
    await page.getByRole("link", { name: "Responder", exact: true }).click();
    await publish(page, "Resposta respeitosa");
    await expect(
      page.getByRole("link", { name: "Em resposta a outro comentário" }),
    ).toBeVisible();
    await page.getByText("Denunciar", { exact: true }).first().click();
    await page.getByLabel("Motivo").first().fill("Ofensa pessoal");
    await page.getByRole("button", { name: "Enviar denúncia" }).first().click();
    await expect(page.getByRole("status")).toContainText("Denúncia enviada");
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.filter((item) =>
        ["serious", "critical"].includes(item.impact ?? ""),
      ),
    ).toEqual([]);
  });
  test("rascunho anônimo permanece ao voltar do login à âncora", async ({
    page,
    context,
  }) => {
    const path = await game(page);
    await context.clearCookies();
    await page.goto(path);
    await page.getByLabel("Seu comentário").fill("Meu rascunho guardado");
    await page
      .getByRole("link", { name: "Entrar para publicar", exact: true })
      .click();
    await expect(page).toHaveURL(/redirect=.*comentar/);
    await login(page);
    await page.goto(`${path}#comentar`);
    await expect(page.getByLabel("Seu comentário")).toHaveValue(
      "Meu rascunho guardado",
    );
    await publish(page, "Meu rascunho guardado");
    await expect(page.getByLabel("Seu comentário")).toHaveValue("");
  });
  test("API de sessão não expõe e-mail e API cursor inválido devolve400", async ({
    page,
  }) => {
    await game(page);
    const me = await page.request.get("/api/me");
    expect(me.headers()["cache-control"]).toContain("no-store");
    expect(await me.text()).not.toContain("email");
    const response = await page.request.get("/api/comments?matchId=invalid");
    expect(response.status()).toBe(400);
  });
});

test("home destaca uma resenha existente e leva aos comentários", async ({
  page,
}) => {
  await game(page);
  await publish(page, "Uma conversa real para o destaque");
  await page.goto("/");
  const link = page
    .getByTestId("resenha-destaque")
    .getByRole("link", { name: "Ver resenha" });
  await expect(link).toHaveAttribute("href", /\/jogos\/.+#comentar$/);
  await link.click();
  await expect(
    page.locator('article[id^="comentario-"]').first(),
  ).toBeVisible();
});
