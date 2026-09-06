/** UUID gerado na aplicação (nunca no banco): IDs estáveis desde a criação, D1 e Postgres iguais. */
export function newId(): string {
  return crypto.randomUUID();
}
