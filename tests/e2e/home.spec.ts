import { expect, test } from "@playwright/test";

// Domínios de fora do próprio site que a home pode legitimamente carregar. Turnstile (fatia F4)
// é o único hoje — o gate de CI equivalente ("rede externa zero") já previa essa exceção.
const ALLOWED_EXTERNAL_HOSTS = ["challenges.cloudflare.com"];

test("home carrega sem erros de JavaScript e só busca fora do site o que está na lista", async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (req) => {
    const rawUrl = req.url();
    // blob:/data: não são requisições de rede reais (o próprio widget do Turnstile gera um blob:
    // local); `new URL(blobUrl).hostname` também não daria o host esperado, então nem chegam a
    // essa checagem.
    if (rawUrl.startsWith("blob:") || rawUrl.startsWith("data:")) return;
    const url = new URL(rawUrl);
    if (
      !["127.0.0.1", "localhost"].includes(url.hostname) &&
      !ALLOWED_EXTERNAL_HOSTS.includes(url.hostname)
    ) {
      external.push(rawUrl);
    }
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Aqui é Vasco. E ponto." }),
  ).toBeVisible();
  await expect(
    page.getByRole("contentinfo").getByText("sem vínculo oficial"),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
