/**
 * Junta a mensagem do erro com a de toda a cadeia de `cause` num só texto. O driver D1 do Drizzle
 * embrulha o erro real do SQLite (ex.: "UNIQUE constraint failed: ...") dentro de
 * `DrizzleQueryError: Failed query: ...`, então checar só `error.message` no nível mais alto nunca
 * encontra o texto que identifica a violação — é preciso descer a cadeia.
 */
function fullErrorText(error: unknown): string {
  const parts: string[] = [];
  let current: unknown = error;
  const seen = new Set<unknown>();
  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    parts.push(current.message);
    current = current.cause;
  }
  return parts.join(" | ");
}

/** Verdadeiro quando o erro veio de uma UNIQUE violada no D1/SQLite (dedup por índice, não por lógica). */
export function isUniqueConstraintError(error: unknown): boolean {
  return fullErrorText(error).includes("UNIQUE constraint failed");
}

/** Verdadeiro quando o erro veio de um CHECK violado no D1/SQLite. */
export function isCheckConstraintError(error: unknown): boolean {
  return fullErrorText(error).includes("CHECK constraint failed");
}
