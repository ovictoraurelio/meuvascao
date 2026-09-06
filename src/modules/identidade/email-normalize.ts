/** Minúsculas e sem espaço nas pontas: chave de deduplicação/lookup para `users.email_normalized`. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
