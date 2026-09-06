/**
 * Valida um destino de `?redirect=` como um caminho relativo ao próprio site — nunca um domínio
 * alheio. Retorna `null` para qualquer coisa que não seja isso, inclusive as formas que um
 * navegador ainda trata como absolutas apesar de "parecerem" relativas: `//evil.example` (URL
 * protocol-relative) e `/\evil.example` (alguns navegadores tratam `\` como `/`).
 */
export function safeRedirectTarget(
  candidate: string | null | undefined,
): string | null {
  if (!candidate) return null;
  if (!candidate.startsWith("/")) return null;
  if (candidate.startsWith("//")) return null;
  if (candidate.startsWith("/\\")) return null;
  // CR/LF não têm o que fazer num caminho — só apareceriam numa tentativa de injetar cabeçalho.
  if (/[\r\n]/.test(candidate)) return null;
  return candidate;
}
