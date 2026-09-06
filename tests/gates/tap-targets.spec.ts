import { expect, test } from "@playwright/test";

const INTERACTIVE_SELECTOR =
  "button, [role=button], input, select, textarea, summary, nav a";

interface Report {
  escaped: string[];
  violations: { tag: string; width: number; height: number }[];
}

// Alvo mínimo de toque (docs/02): 44×44 px em 360 px de largura. Links inline em texto corrido são
// isentos (WCAG 2.5.8, "alvo dentro de frase"); um escape com `data-allow-small-target="motivo"`
// aparece no relatório sem falhar o teste, para revisão humana em vez de um bloqueio silencioso.
test("alvos de toque têm ao menos 44 px em 360 px", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== "celular",
    "gate de alvo de toque só faz sentido no viewport móvel (360 px)",
  );
  await page.goto("/");
  const report = await page.evaluate<Report, string>((selector) => {
    const escaped: string[] = [];
    const violations: { tag: string; width: number; height: number }[] = [];
    for (const el of document.querySelectorAll<HTMLElement>(selector)) {
      if (el.tagName === "A" && el.closest("p, li")) continue;
      const rect = el.getBoundingClientRect();
      const min = Math.min(rect.width, rect.height);
      if (min >= 44) continue;
      const reason = el.dataset.allowSmallTarget;
      if (reason) {
        escaped.push(`${el.tagName.toLowerCase()}: ${reason}`);
      } else {
        violations.push({
          tag: el.tagName.toLowerCase(),
          width: rect.width,
          height: rect.height,
        });
      }
    }
    return { escaped, violations };
  }, INTERACTIVE_SELECTOR);

  for (const line of report.escaped) {
    console.log(`alvo pequeno com escape declarado: ${line}`);
  }
  expect(report.violations, JSON.stringify(report.violations)).toEqual([]);
});
