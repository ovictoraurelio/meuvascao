const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const MIN_CONTRAST_TEXT = 4.5;
export const MIN_CONTRAST_UI = 3;

export interface ContrastPair {
  readonly label: string;
  readonly foreground: string;
  readonly background: string;
  readonly minRatio: number;
}

function srgbChannelToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(hex: string): number {
  if (!HEX_COLOR.test(hex)) {
    throw new Error(`cor inválida (esperado #rrggbb): ${hex}`);
  }
  const value = parseInt(hex.slice(1), 16);
  const r = srgbChannelToLinear((value >> 16) & 0xff);
  const g = srgbChannelToLinear((value >> 8) & 0xff);
  const b = srgbChannelToLinear(value & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Razão de contraste WCAG 2.x entre duas cores `#rrggbb`, sempre ≥ 1. */
export function contrastRatio(hexA: string, hexB: string): number {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Retorna uma mensagem por par abaixo do mínimo declarado; vazio quando todos passam. */
export function checkPairs(pairs: readonly ContrastPair[]): string[] {
  const failures: string[] = [];
  for (const pair of pairs) {
    const ratio = contrastRatio(pair.foreground, pair.background);
    if (ratio < pair.minRatio) {
      failures.push(
        `${pair.label}: ${ratio.toFixed(2)}:1 abaixo do mínimo ${pair.minRatio}:1`,
      );
    }
  }
  return failures;
}
