function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** Codifica texto arbitrário (UTF-8) em base64url, sem padding. */
export function textToBase64Url(text: string): string {
  return toBase64Url(new TextEncoder().encode(text));
}

/** Inverso de textToBase64Url. Lança se o valor não for base64url válido. */
export function base64UrlToText(value: string): string {
  return new TextDecoder().decode(fromBase64Url(value));
}

function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

/** Assinatura HMAC-SHA256 de `data`, codificada em base64url. */
export async function hmacSign(secret: string, data: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );
  return toBase64Url(new Uint8Array(signature));
}

/**
 * Confere `signatureBase64Url` contra `data` em tempo constante (crypto.subtle.verify, não uma
 * comparação de string). Nunca lança — um valor malformado (base64url inválido) só retorna falso.
 */
export async function hmacVerify(
  secret: string,
  data: string,
  signatureBase64Url: string,
): Promise<boolean> {
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = fromBase64Url(signatureBase64Url);
  } catch {
    return false;
  }
  const key = await importHmacKey(secret);
  return crypto.subtle.verify(
    "HMAC",
    key,
    // Uint8Array.from (fromBase64Url) tipa o resultado como Uint8Array<ArrayBufferLike>, mais
    // largo que o ArrayBuffer que BufferSource exige nesta versão do TypeScript — em runtime é
    // sempre um Uint8Array de verdade, aceito por crypto.subtle.verify normalmente.
    signatureBytes as BufferSource,
    new TextEncoder().encode(data),
  );
}
