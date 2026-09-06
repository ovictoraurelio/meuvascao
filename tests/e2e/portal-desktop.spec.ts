import { expect, test } from "@playwright/test";

test("portal distribui destaque e próximo jogo conforme o viewport", async ({
  page,
}, info) => {
  await page.goto("/");
  const hero = page.getByTestId("portal-hero");
  const match = page.getByTestId("dia-de-vasco");
  await expect(hero).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Aqui é Vasco",
  );
  const a = await hero.boundingBox();
  const b = await match.boundingBox();
  if (!a || !b) throw new Error("Portal sem destaque ou jogo");
  if (info.project.name === "desktop") {
    expect(b.x).toBeGreaterThan(a.x + a.width);
    expect(Math.abs(a.y - b.y)).toBeLessThan(2);
    await expect(
      page.getByRole("navigation", {
        name: "Navegação principal",
        exact: true,
      }),
    ).toBeVisible();
  } else {
    expect(a.y).toBeGreaterThanOrEqual(b.y + b.height);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
