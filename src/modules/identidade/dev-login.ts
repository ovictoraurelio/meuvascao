import { z } from "zod";

import type { Database } from "@/lib/db/client";

import { normalizeNickname } from "./nickname";
import {
  buildSessionCookieValue,
  newSessionId,
  SESSION_MAX_AGE_SECONDS,
} from "./session";
import { createSession } from "./sessions.repo";
import {
  createUser,
  findUserByNicknameNormalized,
  setNickname,
  type User,
} from "./users.repo";

export const DEV_LOGIN_ROLES = [
  "torcedor",
  "editor",
  "moderador",
  "admin",
] as const;

export const devLoginSchema = z.object({
  nickname: z.string().trim().min(1),
  role: z.enum(DEV_LOGIN_ROLES).default("torcedor"),
});
export type DevLoginInput = z.infer<typeof devLoginSchema>;

export interface DevLoginResult {
  user: User;
  sessionCookieValue: string;
}

/**
 * Login direto por apelido + papel, sem link mágico — acelera o E2E das fatias que precisam de
 * um editor/moderador/admin autenticado (F7-F9). Verificado em runtime pelo CHAMADOR
 * (src/pages/auth/dev-login.ts): esta função em si não checa ENVIRONMENT, então nunca a exponha
 * atrás de uma rota que não tenha checado antes.
 *
 * O papel só é usado na criação; um apelido que já existe entra com o papel que já tem — cada
 * combinação apelido/papel de teste usa seu próprio apelido fixo (ex.: "editor-dev"), então não há
 * necessidade de trocar o papel de um usuário existente por aqui.
 */
export async function devLogin(
  db: Database,
  input: DevLoginInput,
): Promise<DevLoginResult> {
  const nicknameNormalized = normalizeNickname(input.nickname);
  let user = await findUserByNicknameNormalized(db, nicknameNormalized);
  if (!user) {
    const email = `dev-${nicknameNormalized}@example.invalid`;
    const created = await createUser(db, {
      email,
      emailNormalized: email,
      role: input.role,
    });
    user = await setNickname(
      db,
      created.id,
      input.nickname,
      nicknameNormalized,
    );
  }

  const sessionId = newSessionId();
  await createSession(db, {
    id: sessionId,
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
  });
  const sessionCookieValue = await buildSessionCookieValue(sessionId, user.id);
  return { user, sessionCookieValue };
}
