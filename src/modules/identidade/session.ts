import type { AstroCookies } from "astro";

import {
  base64UrlToText,
  hmacSign,
  hmacVerify,
  textToBase64Url,
} from "@/lib/crypto/hmac";
import { getEnv, isDevelopment } from "@/lib/env";

export const SESSION_COOKIE_NAME = "mv_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

// Só para desenvolvimento local — um segredo público e conhecido (visível a qualquer um que leia o
// repositório) nunca pode assinar sessão de verdade. Ao contrário de src/lib/turnstile.ts (cuja
// chave de teste degrada para "sempre aprova", pior caso é spam), um SESSION_SECRET público
// deixaria qualquer um forjar um cookie de sessão válido para qualquer usuário — a diferença de
// risco justifica falhar fechado aqui, não só avisar e continuar.
const DEV_FALLBACK_SECRET =
  "dev-only-insecure-session-secret-nunca-use-em-producao";

export class SessionSecretMissingError extends Error {
  constructor() {
    super("SESSION_SECRET não configurado — recusando assinar sessão.");
  }
}

function getSessionSecret(): string {
  // SESSION_SECRET não está em wrangler.jsonc por ser segredo de produção (`wrangler secret
  // put`); o tipo gerado não garante nada sobre ele (ver src/env.d.ts).
  const configured = getEnv().SESSION_SECRET;
  if (configured) return configured;
  if (!isDevelopment()) throw new SessionSecretMissingError();
  return DEV_FALLBACK_SECRET;
}

export interface SessionCookiePayload {
  sid: string;
  uid: string;
  exp: number;
}

/** Gera o id de sessão: 32 bytes aleatórios em hex, guardado como está tanto no cookie quanto em `sessions.id`. */
export function newSessionId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/** Monta o valor do cookie `mv_session`: payload em base64url + assinatura, separados por ".". */
export async function buildSessionCookieValue(
  sid: string,
  uid: string,
): Promise<string> {
  const exp = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload: SessionCookiePayload = { sid, uid, exp };
  const payloadEncoded = textToBase64Url(JSON.stringify(payload));
  const signature = await hmacSign(getSessionSecret(), payloadEncoded);
  return `${payloadEncoded}.${signature}`;
}

/**
 * Confere a assinatura e a expiração do cookie — sem nenhuma leitura de D1. Não confirma que a
 * sessão ainda existe na tabela `sessions` nem que não foi revogada; isso só importa em escritas
 * e em `/perfil`, que consultam o banco por conta própria (getAuthenticatedUser).
 */
export async function verifySessionCookieValue(
  value: string | undefined,
): Promise<SessionCookiePayload | null> {
  if (!value) return null;
  const separatorIndex = value.lastIndexOf(".");
  if (separatorIndex === -1) return null;
  const payloadEncoded = value.slice(0, separatorIndex);
  const signature = value.slice(separatorIndex + 1);

  let secret: string;
  try {
    secret = getSessionSecret();
  } catch (error) {
    if (error instanceof SessionSecretMissingError) return null;
    throw error;
  }
  if (!(await hmacVerify(secret, payloadEncoded, signature))) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(base64UrlToText(payloadEncoded));
  } catch {
    return null;
  }
  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof (payload as SessionCookiePayload).sid !== "string" ||
    typeof (payload as SessionCookiePayload).uid !== "string" ||
    typeof (payload as SessionCookiePayload).exp !== "number"
  ) {
    return null;
  }
  const { sid, uid, exp } = payload as SessionCookiePayload;
  if (exp <= Date.now()) return null;
  return { sid, uid, exp };
}

/** Grava o cookie de sessão com os mesmos atributos em todo lugar que abre uma sessão. */
export function setSessionCookie(cookies: AstroCookies, value: string): void {
  cookies.set(SESSION_COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/** Mesmo `path` do set — sem isso o navegador trataria como um cookie diferente e não o limparia. */
export function clearSessionCookie(cookies: AstroCookies): void {
  cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
}
