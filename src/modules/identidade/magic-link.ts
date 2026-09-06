import { z } from "zod";

import type { Database } from "@/lib/db/client";
import { sha256Hex } from "@/lib/crypto/hash";
import { getEnv, isDevelopment } from "@/lib/env";
import { verifyTurnstileToken } from "@/lib/turnstile";

import { createDevMailboxSender } from "./email-dev-mailbox";
import { normalizeEmail } from "./email-normalize";
import { createResendSender } from "./email-resend";
import type { EmailSender } from "./email-sender";
import {
  buildSessionCookieValue,
  newSessionId,
  SESSION_MAX_AGE_SECONDS,
} from "./session";
import { createSession } from "./sessions.repo";
import { consumeAuthToken, reserveAuthToken } from "./tokens.repo";
import { findOrCreateUserByEmail, type User } from "./users.repo";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export class RateLimitedError extends Error {}
export class TurnstileFailedError extends Error {}
export class InvalidOrExpiredTokenError extends Error {}

export const requestMagicLinkSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu e-mail.")
    .pipe(z.email("Informe um e-mail válido.")),
  redirect: z.string().optional(),
  turnstileToken: z.string().min(1, "Confirme que você não é um robô."),
});
export type RequestMagicLinkInput = z.infer<typeof requestMagicLinkSchema>;

function newAuthTokenPlaintext(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/** Resend em ambientes públicos; mailbox apenas no desenvolvimento local. */
function getEmailSender(db: Database): EmailSender {
  if (!isDevelopment()) {
    return createResendSender(getEnv().RESEND_API_KEY ?? "");
  }
  return createDevMailboxSender(db);
}

export interface RequestMagicLinkContext {
  db: Database;
  // Nulo quando a requisição não chegou por trás da Cloudflare (astro dev local sem
  // cf-connecting-ip). Quando presente localmente (wrangler dev simula um IP fixo do próprio
  // ambiente), ainda assim não é um IP de cliente de verdade — ver o comentário sobre o limite
  // por IP abaixo.
  ip: string | null;
  siteUrl: string;
}

/**
 * Pedido de link mágico: Turnstile, limite por e-mail (3/15min, sempre) e por IP (10/15min, só em
 * ambientes públicos), token de 32 bytes (só o hash SHA-256 vai para o banco) com validade de 15 minutos,
 * e-mail enviado pelo sender do ambiente atual. Nunca revela se o e-mail já tem conta — o próprio
 * fluxo de confirmação cria a conta na hora, se preciso.
 *
 * O limite por IP vale em preview e produção. Desenvolvimento usa IP simulado compartilhado,
 * então só o limite por e-mail é aplicado ali. A reserva no repositório é atômica.
 */
export async function requestMagicLink(
  { db, ip, siteUrl }: RequestMagicLinkContext,
  input: RequestMagicLinkInput,
): Promise<void> {
  if (!(await verifyTurnstileToken(input.turnstileToken, ip ?? undefined))) {
    throw new TurnstileFailedError();
  }

  const emailNormalized = normalizeEmail(input.email);
  const ipHash = ip ? await sha256Hex(ip) : undefined;
  const token = newAuthTokenPlaintext();
  const reserved = await reserveAuthToken(
    db,
    {
      emailNormalized,
      tokenHash: await sha256Hex(token),
      expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      ipHash,
    },
    !isDevelopment(),
  );
  if (!reserved) throw new RateLimitedError();

  const confirmUrl = new URL("/entrar/confirmar", siteUrl);
  confirmUrl.searchParams.set("token", token);
  if (input.redirect) confirmUrl.searchParams.set("redirect", input.redirect);

  await getEmailSender(db).sendMagicLink({
    to: input.email,
    link: confirmUrl.toString(),
  });
}

export interface ConfirmMagicLinkResult {
  user: User;
  sessionCookieValue: string;
}

/**
 * Consome o token (atômico — ver tokens.repo) e abre a sessão. Cria o usuário na hora se o
 * e-mail nunca tinha entrado antes; o apelido continua nulo até a escolha (fora daqui).
 */
export async function confirmMagicLink(
  db: Database,
  token: string,
): Promise<ConfirmMagicLinkResult> {
  const consumed = await consumeAuthToken(db, await sha256Hex(token));
  if (!consumed) throw new InvalidOrExpiredTokenError();

  // auth_tokens só guarda o e-mail normalizado (nunca a grafia original digitada no pedido) — o
  // e-mail exibido para um usuário novo nasce já normalizado; ver users.repo.ts.
  const user = await findOrCreateUserByEmail(db, {
    email: consumed.emailNormalized,
    emailNormalized: consumed.emailNormalized,
  });

  const sessionId = newSessionId();
  await createSession(db, {
    id: sessionId,
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
  });
  const sessionCookieValue = await buildSessionCookieValue(sessionId, user.id);

  return { user, sessionCookieValue };
}
