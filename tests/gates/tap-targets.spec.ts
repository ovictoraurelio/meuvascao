import { expect, test } from "@playwright/test";

// `input` exclui checkbox/radio: o alvo acessível dessas duas é o `<label>` que os envolve (maior
// que o controle nativo), não o input em si; o `<label>` mesmo não entra aqui por não ter, sozinho,
// um papel interativo reconhecido pelo seletor — quem cobre esse caso é o gate de axe (rótulo
// associado) mais a revisão humana até a F4 ter um formulário real para medir.
const INTERACTIVE_SELECTOR =
  "button, [role=button], input:not([type=checkbox]):not([type=radio]), select, textarea, summary, nav a";

interface Report {
  escaped: string[];
  violations: { tag: string; width: number; height: number }[];
}

// Alvo mínimo de toque (docs/02): 44×44 px em 360 px de largura. Links inline em texto corrido são
// isentos (WCAG 2.5.8, "alvo dentro de frase") — só dentro de `p`: um `<li>` de menu (o padrão de
// `nav a`) não é "texto corrido" e não deve ganhar a isenção de graça. Um escape com
// `data-allow-small-target="motivo"` aparece no relatório sem falhar o teste, para revisão humana
// em vez de um bloqueio silencioso.
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
      if (el.tagName === "A" && el.closest("p")) continue;
      const rect = el.getBoundingClientRect();
      // Elemento sem caixa (display: none, oculto por breakpoint) não é um alvo de toque real:
      // não é "pequeno demais", é ausente — reportar isso como violação de 44 px seria um falso
      // positivo, não o que o gate existe para pegar.
      if (rect.width === 0 || rect.height === 0) continue;
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
