import { expect, test } from "@playwright/test";

interface Violation {
  tag: string;
  text: string;
  fontSize: string;
}

// Piso de leitura (docs/02): nenhum texto visível abaixo de 12 px. O único escape é
// `.visually-hidden` (texto só para leitores de tela não é "texto visível" para este gate).
test("nenhum texto visível fica abaixo de 12 px", async ({ page }) => {
  await page.goto("/");
  const violations = await page.evaluate<Violation[]>(() => {
    const found: Violation[] = [];
    for (const el of document.body.querySelectorAll("*")) {
      if (el.closest(".visually-hidden")) continue;
      const ownText = Array.from(el.childNodes)
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent ?? "")
        .join("")
        .trim();
      if (!ownText) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;
      const fontSize = parseFloat(style.fontSize);
      if (fontSize < 12) {
        found.push({
          tag: el.tagName.toLowerCase(),
          text: ownText.slice(0, 40),
          fontSize: style.fontSize,
        });
      }
    }
    return found;
  });
  expect(violations, JSON.stringify(violations)).toEqual([]);
});
