import { z } from "zod";

import { isUniqueConstraintError } from "@/lib/db/errors";
import type { Database } from "@/lib/db/client";

import { ReservedNicknameError } from "./account.service";
import { isReservedNickname, normalizeNickname } from "./nickname";
import {
  buildSessionCookieValue,
  newSessionId,
  SESSION_MAX_AGE_SECONDS,
} from "./session";
import { createSession } from "./sessions.repo";
import {
  createUser,
  findUserByNicknameNormalized,
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
  if (isReservedNickname(input.nickname)) throw new ReservedNicknameError();

  const nicknameNormalized = normalizeNickname(input.nickname);
  let user = await findUserByNicknameNormalized(db, nicknameNormalized);
  if (!user) {
    // Duas chamadas concorrentes para o mesmo apelido novo (dois testes E2E disparando o mesmo
    // fixture ao mesmo tempo) veriam ambas `user` nulo aqui; sem isto, a segunda propagaria o
    // erro cru de UNIQUE do e-mail sintetizado em vez de simplesmente usar quem a primeira criou.
    // createUser grava o apelido no mesmo INSERT (não um INSERT seguido de UPDATE): a busca de
    // recuperação abaixo (por apelido) só encontra a linha da outra chamada se ela já nasceu com
    // o apelido preenchido.
    try {
      const email = `dev-${nicknameNormalized}@example.invalid`;
      user = await createUser(db, {
        email,
        emailNormalized: email,
        nickname: input.nickname,
        nicknameNormalized,
        role: input.role,
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
      const createdByOther = await findUserByNicknameNormalized(
        db,
        nicknameNormalized,
      );
      if (!createdByOther) throw error;
      user = createdByOther;
    }
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
