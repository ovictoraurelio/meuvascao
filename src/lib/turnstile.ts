import { getEnv, isProduction } from "@/lib/env";

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

function isTestKey(value: string): boolean {
  return /^[123]x0{10,}/.test(value);
}

/** Chave pública para o widget no HTML. Vazia em .dev.vars → chave de teste (sempre aprova). */
export function getTurnstileSiteKey(): string {
  const configured = turnstileEnv().TURNSTILE_SITE_KEY;
  if (isProduction() && (!configured || isTestKey(configured))) return "";
  return configured || TEST_SITE_KEY;
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
  const configuredSecret = turnstileEnv().TURNSTILE_SECRET_KEY;
  if (isProduction() && (!configuredSecret || isTestKey(configuredSecret)))
    return false;
  const secret = configuredSecret || TEST_SECRET_KEY;
  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    if (!res.ok) return false;
    const data = (await res.json()) as SiteverifyResponse;
    return data.success === true;
  } catch {
    // Falha de rede ao chamar a Cloudflare (DNS, timeout, indisponibilidade): trata como
    // verificação reprovada em vez de deixar o erro vazar para o usuário como 500 genérico.
    return false;
  }
}
