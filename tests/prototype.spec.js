const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  // Interaction tests should not depend on external image/font availability.
  await page.route(
    /^https:\/\/(images\.unsplash\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)\//,
    (route) => route.abort(),
  );
});

test("news filters, dialog and persistent reactions", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".news-card")).toHaveCount(3);
  await page.locator('[data-filter="Base"]').click();
  await expect(page.locator(".news-card")).toHaveCount(1);
  await page.locator(".news-title").click();
  await expect(page.getByRole("dialog")).toHaveAccessibleName(
    "O futuro do Gigante começa na base",
  );
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.locator("[data-like='3']").click();
  await page.reload();
  await page.locator('[data-filter="Base"]').click();
  await expect(page.locator("[data-like='3']")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("profile, topic and reply persist and treat markup as text", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator("#join").click();
  await page.locator("#nickname").fill("Torcedor teste");
  await page.locator("#profile-form button").click();
  await page.locator("#new-topic").click();
  const payload = '<img src=x onerror="window.injected=true">';
  await page.locator("#topic-title").fill(payload);
  await page.locator("#topic-body").fill("Uma conversa de teste");
  await page.locator("#topic-form button").click();
  await page.locator("[data-topic='3']").click();
  await page.locator("#reply").fill(payload);
  await page.locator("#reply-form button").click();
  await expect(page.locator("#replies")).toContainText(payload);
  await expect(page.locator("#replies img")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#join")).toContainText("Torcedor teste");
  await expect(page.locator("[data-topic='3']")).toContainText("1 respostas");
  await page.locator("[data-topic='3']").click();
  await expect(page.locator("#replies")).toContainText(payload);
  expect(await page.evaluate(() => window.injected)).toBeUndefined();
});

test("invalid saved data does not prevent the prototype from loading", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("mv-likes", "{");
    localStorage.setItem("mv-topics", '[{"tag":null}]');
    localStorage.setItem("mv-replies-0", "{}");
    localStorage.setItem("mv-vote", "99");
  });
  await page.goto("/");
  await expect(page.locator(".news-card")).toHaveCount(3);
  await expect(page.locator(".topic")).toHaveCount(3);
  await page.locator("[data-topic='0']").click();
  await expect(page.locator("#reply")).toBeVisible();
  expect(errors).toEqual([]);
});

test("blocked storage allows temporary interactions and explains persistence", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new DOMException("Storage blocked", "SecurityError");
      },
    });
  });
  await page.goto("/");
  await page.locator("[data-vote='0']").click();
  await expect(page.locator("#poll-note")).toContainText("só nesta sessão");
  await expect(page.locator(".demo-label")).toContainText(
    "armazenamento indisponível",
  );
  await page.locator("[data-topic='0']").click();
  await page.locator("#reply").fill("Ainda consigo participar da demonstração");
  await page.locator("#reply-form button").click();
  await page.keyboard.press("Escape");
  await page.locator("[data-topic='0']").click();
  await expect(page.locator("#replies")).toContainText(
    "Ainda consigo participar",
  );
  expect(errors).toEqual([]);
});

test("mobile navigation resets its state and the page fits 360px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Menu principal" });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.locator("nav a[href='#jogos']").click();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await page.locator("#join").click();
  await page.locator("#nickname").fill("UmApelidoComTrintaCaracteresABC");
  await page.locator("#profile-form button").click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(360);
});
