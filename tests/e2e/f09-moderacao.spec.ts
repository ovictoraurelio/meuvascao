import { expect, type Page, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const environment = process.env.E2E_ENVIRONMENT ?? "development";
test.skip(
  environment !== "development",
  "Login de teste só existe em development",
);
async function login(page: Page, baseURL: string | undefined, role: string) {
  if (!baseURL) throw new Error("Servidor de teste ausente.");
  const response = await page.request.post("/auth/dev-login", {
    headers: { Origin: baseURL },
    form: { nickname: `F9${crypto.randomUUID().slice(0, 12)}`, role },
  });
  expect(response.ok()).toBeTruthy();
}

async function sessionHeaders(page: Page, baseURL: string | undefined) {
  // APIRequestContext não envia automaticamente cookies Secure no HTTP local;
  // preservamos a configuração de produção e enviamos o cookie explicitamente no ensaio.
  const cookies = await page.context().cookies();
  return {
    Origin: baseURL ?? "",
    Cookie: cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; "),
  };
}

test("torcedor recebe 403 e noindex na fila e em todas as decisões", async ({
  page,
  baseURL,
}) => {
  await login(page, baseURL, "torcedor");
  const response = await page.goto("/admin/moderacao");
  expect(response?.status()).toBe(403);
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  expect(response?.headers()["cache-control"]).toContain("no-store");
  for (const name of [
    "ocultarComentario",
    "resolverDenuncia",
    "definirSuspensao",
    "definirModoLento",
    "definirThreadFechada",
    "definirEscritaFechada",
  ]) {
    const action = await page.request.post(`/_actions/moderacao.${name}`, {
      headers: await sessionHeaders(page, baseURL),
      form: {},
    });
    expect(action.status()).toBe(403);
  }
});

test("moderador acessa controles privados com formulários acessíveis", async ({
  page,
  baseURL,
}) => {
  await login(page, baseURL, "moderador");
  await page.goto("/perfil");
  await page.getByRole("link", { name: "Área da equipe" }).click();
  await expect(page).toHaveURL(/\/admin\/moderacao$/);
  const response = await page.goto("/admin/moderacao");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["cache-control"]).toContain("no-store");
  await expect(
    page.getByRole("heading", { name: "Moderação da resenha" }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(
    axe.violations.filter((item) =>
      ["serious", "critical"].includes(item.impact ?? ""),
    ),
  ).toEqual([]);
});

test("denúncia analisada por humano oculta texto e preserva marcador público", async ({
  page,
  baseURL,
}, info) => {
  await login(page, baseURL, "torcedor");
  const body = `Comentário para revisão ${info.project.name} ${crypto.randomUUID()}`;
  const game = "/jogos/vasco-x-adversario-seed";
  await page.goto(game);
  const matchId = await page
    .locator('input[name="matchId"]')
    .first()
    .inputValue();
  const posted = await page.request.post("/_actions/comunidade.comentar", {
    headers: await sessionHeaders(page, baseURL),
    form: {
      matchId,
      body,
      idempotencyKey: crypto.randomUUID(),
      "cf-turnstile-response": "XXXX.DUMMY.TOKEN.XXXX",
    },
  });
  expect(posted.ok()).toBeTruthy();
  await page.goto(game);
  const article = page
    .locator('article[id^="comentario-"]')
    .filter({ hasText: body });
  const anchor = await article.getAttribute("id");
  if (!anchor) throw new Error("Comentário não encontrado.");
  const commentId = anchor.slice("comentario-".length);
  await login(page, baseURL, "torcedor");
  const reported = await page.request.post("/_actions/comunidade.denunciar", {
    headers: await sessionHeaders(page, baseURL),
    form: { commentId, reason: "spam" },
  });
  expect(reported.ok()).toBeTruthy();
  await login(page, baseURL, "moderador");
  await page.goto("/admin/moderacao");
  const report = page
    .locator("article[data-report-id]")
    .filter({ hasText: body });
  await report
    .getByLabel("Motivo para ocultar", { exact: true })
    .fill("Spam confirmado após revisão");
  await report
    .getByRole("button", { name: "Ocultar comentário", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Decisão registrada");
  await page.goto(game);
  await expect(page.getByText(body, { exact: true })).toHaveCount(0);
  await expect(page.locator(`[id="${anchor}"]`)).toContainText(
    /ocultado.*moderação/i,
  );
});

test("moderador suspenso recebe 403 direto e vê motivo escapado no perfil", async ({
  page,
  browser,
  baseURL,
}) => {
  await login(page, baseURL, "moderador");
  const cookie = (await page.context().cookies()).find(
    (item) => item.name === "mv_session",
  );
  if (!cookie) throw new Error("Sessão de teste ausente.");
  const payload = JSON.parse(
    Buffer.from(cookie.value.split(".")[0] ?? "", "base64url").toString(),
  ) as { uid: string };
  const admin = await browser.newPage({ baseURL });
  const reason = 'Conduta reiterada <img src=x onerror="alert(1)">';
  try {
    await login(admin, baseURL, "admin");
    const result = await admin.request.post(
      "/_actions/moderacao.definirSuspensao",
      {
        headers: await sessionHeaders(admin, baseURL),
        form: { id: payload.uid, suspended: "true", reason },
      },
    );
    expect(
      result.ok(),
      `${result.status()} ${await result.text()}`,
    ).toBeTruthy();
    const denied = await page.request.post(
      "/_actions/moderacao.definirEscritaFechada",
      {
        headers: await sessionHeaders(page, baseURL),
        form: { closed: "true", reason: "Tentativa proibida" },
      },
    );
    expect(denied.status()).toBe(403);
    await page.goto("/perfil");
    await expect(
      page.getByRole("heading", { name: "Sua conta está suspensa" }),
    ).toBeVisible();
    await expect(page.getByText(reason, { exact: true })).toBeVisible();
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
  } finally {
    await admin.close();
  }
});
