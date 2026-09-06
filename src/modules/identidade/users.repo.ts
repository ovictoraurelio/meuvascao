import { eq } from "drizzle-orm";

import { assertReturningRow, isUniqueConstraintError } from "@/lib/db/errors";
import type { Database } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import { newId } from "@/lib/ids";

import { normalizeNickname } from "./nickname";

export class DuplicateNicknameError extends Error {}

export type User = typeof users.$inferSelect;

export async function findUserByEmailNormalized(
  db: Database,
  emailNormalized: string,
): Promise<User | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.emailNormalized, emailNormalized));
  return row ?? null;
}

export async function findUserById(
  db: Database,
  id: string,
): Promise<User | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return row ?? null;
}

export async function findUserByNicknameNormalized(
  db: Database,
  nicknameNormalized: string,
): Promise<User | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.nicknameNormalized, nicknameNormalized));
  return row ?? null;
}

/**
 * Cria o usuário sem apelido ainda — o primeiro login pede a escolha antes de liberar a sessão.
 * `role` só existe para o dev-login (fatia F6, testes das fatias seguintes); o fluxo normal do
 * link mágico nunca a informa e o usuário nasce "torcedor" (padrão do próprio esquema).
 */
export async function createUser(
  db: Database,
  input: {
    email: string;
    emailNormalized: string;
    role?: User["role"];
  },
): Promise<User> {
  const now = new Date();
  const [row] = await db
    .insert(users)
    .values({
      id: newId(),
      email: input.email,
      emailNormalized: input.emailNormalized,
      role: input.role,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return assertReturningRow(row, "usuário");
}

export async function setNickname(
  db: Database,
  userId: string,
  nickname: string,
  nicknameNormalized: string,
): Promise<User> {
  try {
    const [row] = await db
      .update(users)
      .set({ nickname, nicknameNormalized, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return assertReturningRow(row, "usuário");
  } catch (error) {
    if (isUniqueConstraintError(error)) throw new DuplicateNicknameError();
    throw error;
  }
}

/**
 * Exclusão a pedido do próprio usuário: e-mail removido, apelido anonimizado com um sufixo curto
 * do id (nunca reutilizável nem colidindo com outro "torcedor-excluído"), status "deleted". As
 * linhas de `comments` (fatia F8) apontam para este id e viram "removido pelo autor" por conta
 * própria — este repositório não sabe nada sobre threads/comentários.
 */
export async function anonymizeAndDeleteUser(
  db: Database,
  userId: string,
): Promise<User> {
  const now = new Date();
  const anonymizedNickname = `torcedor-excluído-${userId.slice(0, 8)}`;
  const [row] = await db
    .update(users)
    .set({
      email: "",
      emailNormalized: `deleted-${userId}`,
      nickname: anonymizedNickname,
      nicknameNormalized: normalizeNickname(anonymizedNickname),
      status: "deleted",
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(users.id, userId))
    .returning();
  return assertReturningRow(row, "usuário");
}
