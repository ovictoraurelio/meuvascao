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
  const { scrollWidth, overflow } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    overflow: Array.from(document.querySelectorAll("body *"))
      .filter(
        (el) =>
          el.getBoundingClientRect().right > 360 ||
          el.scrollWidth > el.clientWidth + 1,
      )
      .map((el) => ({
        tag: el.tagName,
        class: el.className,
        width: el.getBoundingClientRect().width,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        text: el.textContent?.slice(0, 60),
      })),
  }));
  expect(scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(360);
});
