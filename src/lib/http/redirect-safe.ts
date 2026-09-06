// Domínio reservado (RFC 2606) que nunca resolve de verdade: só serve de "âncora" para o parser
// de URL comparar origem, nunca é contactado.
const SAFE_BASE = "https://redirect-safe.invalid";

function containsControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

/**
 * Valida um destino de `?redirect=` como um caminho relativo ao próprio site — nunca um domínio
 * alheio. Em vez de bloquear caractere por caractere (frágil: um agente anterior desta mesma
 * fatia tentou isso e deixou passar TAB, que o parser de URL do próprio navegador remove antes de
 * resolver a URL, transformando "/\t/evil.example" em "//evil.example" — protocol-relative para
 * um domínio alheio), resolve o candidato como o navegador resolveria e compara a origem
 * resultante com uma âncora fixa: só passa quem continua na mesma origem depois da resolução real.
 * Caracteres de controle são rejeitados antes disso, de qualquer forma, por segurança adicional.
 */
export function safeRedirectTarget(
  candidate: string | null | undefined,
): string | null {
  if (!candidate) return null;
  if (containsControlCharacter(candidate)) return null;

  let resolved: URL;
  try {
    resolved = new URL(candidate, SAFE_BASE);
  } catch {
    return null;
  }
  if (resolved.origin !== SAFE_BASE) return null;

  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}
