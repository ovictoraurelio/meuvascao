import { expect, test } from "@playwright/test";

test("produção mantém estilos sem violações de CSP", async ({ page }) => {
  test.skip(
    process.env.E2E_ENVIRONMENT !== "production",
    "política de produção",
  );
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", () => {
      document.documentElement.dataset.cspViolation = "true";
    });
  });
  for (const route of [
    "/",
    "/jogos",
    "/sobre",
    "/entrar",
    "/resenha",
    "/jogos/vasco-x-adversario-seed",
  ]) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("link[rel=stylesheet]").first()).toBeAttached();
    await expect(page.locator("style")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => getComputedStyle(document.body).backgroundColor,
      ),
    ).toBe("rgb(250, 250, 247)");
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-csp-violation",
      "true",
    );
  }
});
