import { getEnv } from "@/lib/env";

// Chaves de teste públicas da Cloudflare: sempre aprovam, documentadas para uso em dev/CI.
// https://developers.cloudflare.com/turnstile/troubleshooting/testing/
const TEST_SITE_KEY = "1x00000000000000000000AA";
const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// TURNSTILE_SITE_KEY/TURNSTILE_SECRET_KEY não estão em wrangler.jsonc: a chave secreta é segredo
// de produção (`wrangler secret put`), nunca um valor em texto no repositório, e o tipo `Env`
// gerado não garante nada sobre eles (mesmo padrão de src/lib/env.ts para segredos futuros).
interface TurnstileEnv {
  TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
}

function turnstileEnv(): TurnstileEnv {
  return getEnv() as unknown as TurnstileEnv;
}

/** Chave pública para o widget no HTML. Vazia em .dev.vars → chave de teste (sempre aprova). */
export function getTurnstileSiteKey(): string {
  return turnstileEnv().TURNSTILE_SITE_KEY || TEST_SITE_KEY;
}

interface SiteverifyResponse {
  success: boolean;
}

/** Confirma no servidor da Cloudflare que o token do widget é de um humano (ou de teste). */
export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  if (!token) return false;
  const secret = turnstileEnv().TURNSTILE_SECRET_KEY || TEST_SECRET_KEY;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const res = await fetch(VERIFY_URL, { method: "POST", body });
  if (!res.ok) return false;
  const data = (await res.json()) as SiteverifyResponse;
  return data.success === true;
}
