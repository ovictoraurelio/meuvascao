import { z } from "zod";

import type { Database } from "@/lib/db/client";

import { isReservedNickname, normalizeNickname } from "./nickname";
import type { SessionCookiePayload } from "./session";
import { findActiveSession, type Session } from "./sessions.repo";
import {
  anonymizeAndDeleteUser,
  findUserById,
  setNickname,
  type User,
} from "./users.repo";

export class SuspendedAccountError extends Error {}

export interface AuthenticatedUser {
  session: Session;
  user: User;
}

/**
 * Confirma no banco o que o cookie (verificado sem I/O no middleware) só afirma: a sessão ainda
 * existe e não foi revogada, e a conta não foi excluída. Usado em escritas e em /perfil — nunca
 * no caminho de um GET anônimo, que nem chega a ter `cookiePayload`.
 */
export async function getAuthenticatedUser(
  db: Database,
  cookiePayload: SessionCookiePayload | null,
): Promise<AuthenticatedUser | null> {
  if (!cookiePayload) return null;
  // As duas consultas não dependem uma da outra: o uid já vem do cookie, e a checagem de que ele
  // bate com o dono real da sessão acontece depois que as duas resolvem, não antes de disparar a
  // segunda.
  const [session, user] = await Promise.all([
    findActiveSession(db, cookiePayload.sid),
    findUserById(db, cookiePayload.uid),
  ]);
  if (!session || session.userId !== cookiePayload.uid) return null;
  if (!user || user.status === "deleted") return null;
  return { session, user };
}

/** CLAUDE.md #7: conta suspensa bloqueada em toda escrita — exceto excluir a própria conta. */
export function requireNotSuspended(user: User): void {
  if (user.status === "suspended") throw new SuspendedAccountError();
}

const NICKNAME_MIN_LENGTH = 2;
const NICKNAME_MAX_LENGTH = 30;

export const chooseNicknameSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(NICKNAME_MIN_LENGTH, "O apelido precisa de pelo menos 2 caracteres.")
    .max(NICKNAME_MAX_LENGTH, "O apelido pode ter no máximo 30 caracteres."),
  redirect: z.string().optional(),
});
export type ChooseNicknameInput = z.infer<typeof chooseNicknameSchema>;

export class ReservedNicknameError extends Error {}

export async function chooseNickname(
  db: Database,
  userId: string,
  nickname: string,
): Promise<User> {
  if (isReservedNickname(nickname)) throw new ReservedNicknameError();
  return setNickname(db, userId, nickname, normalizeNickname(nickname));
}

/**
 * Exclusão a pedido do próprio usuário (LGPD): sempre permitida, mesmo para uma conta suspensa —
 * é um direito da pessoa, não uma escrita na comunidade que a suspensão deveria bloquear.
 */
export async function deleteOwnAccount(
  db: Database,
  userId: string,
): Promise<void> {
  await anonymizeAndDeleteUser(db, userId);
}

export interface AccountExport {
  email: string;
  apelido: string | null;
  papel: User["role"];
  criadaEm: string;
}

/** Só os campos que fazem sentido para o próprio dono ver — nunca hash de token nem HMAC de sessão. */
export function buildAccountExport(user: User): AccountExport {
  return {
    email: user.email,
    apelido: user.nickname,
    papel: user.role,
    criadaEm: user.createdAt.toISOString(),
  };
}
