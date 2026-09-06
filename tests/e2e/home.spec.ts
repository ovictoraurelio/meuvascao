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
    const url = new URL(req.url());
    if (
      !["127.0.0.1", "localhost"].includes(url.hostname) &&
      !ALLOWED_EXTERNAL_HOSTS.includes(url.hostname)
    ) {
      external.push(req.url());
    }
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Meu Vascão" }),
  ).toBeAttached();
  await expect(page.getByText("sem vínculo oficial")).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
