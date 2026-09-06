// Web Crypto (disponível no runtime do Worker, sem dependência extra). Usado para ip_hash e,
// futuramente, para o token do link mágico (fatia F6) — nunca gravamos o IP nem o token cru.
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
