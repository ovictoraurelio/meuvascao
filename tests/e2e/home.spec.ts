import { expect, test } from "@playwright/test";

test("home carrega sem erros de JavaScript e sem recursos externos", async ({
  page,
}) => {
  const errors: string[] = [];
  const external: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (req) => {
    const url = new URL(req.url());
    if (!["127.0.0.1", "localhost"].includes(url.hostname))
      external.push(req.url());
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Meu Vascão" }),
  ).toBeVisible();
  await expect(page.getByText("sem vínculo oficial")).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});
