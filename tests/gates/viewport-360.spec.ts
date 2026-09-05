import { expect, test } from "@playwright/test";

// Largura mínima suportada (docs/01:57): nenhuma página rola horizontalmente em 360 px.
// Roda no projeto `celular` (Galaxy S24, 360×780, isMobile), sem redimensionar um contexto desktop.
test("a home cabe em 360 px sem rolagem horizontal", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "celular",
    "gate de largura só faz sentido no projeto celular",
  );
  await page.goto("/");
  const scrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );
  expect(scrollWidth).toBeLessThanOrEqual(360);
});
