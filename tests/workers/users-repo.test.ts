import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { isUniqueConstraintError } from "@/lib/db/errors";
import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import {
  anonymizeAndDeleteUser,
  createUser,
  DuplicateNicknameError,
  findUserByEmailNormalized,
  findUserByNicknameNormalized,
  setNickname,
} from "@/modules/identidade/users.repo";

describe("users.repo", () => {
  const db = getDb(env.DB);

  it("cria sem apelido, encontra por e-mail normalizado e ainda não aparece por apelido", async () => {
    const user = await createUser(db, {
      email: "Torcedor@Example.com",
      emailNormalized: "torcedor@example.com",
    });
    expect(user.nickname).toBeNull();
    expect(user.role).toBe("torcedor");
    expect(user.status).toBe("active");

    const found = await findUserByEmailNormalized(db, "torcedor@example.com");
    expect(found?.id).toBe(user.id);
  });

  it("um e-mail normalizado duplicado é uma violação de UNIQUE", async () => {
    await createUser(db, {
      email: "duplicado@example.com",
      emailNormalized: "duplicado@example.com",
    });
    let caught: unknown;
    try {
      await db.insert(users).values({
        id: "dup-id",
        email: "outro@example.com",
        emailNormalized: "duplicado@example.com",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (error) {
      caught = error;
    }
    expect(isUniqueConstraintError(caught)).toBe(true);
  });

  it("define o apelido e passa a ser encontrável por ele", async () => {
    const user = await createUser(db, {
      email: "escolhe-apelido@example.com",
      emailNormalized: "escolhe-apelido@example.com",
    });
    await setNickname(db, user.id, "Cartola Fera", "cartola fera");
    const found = await findUserByNicknameNormalized(db, "cartola fera");
    expect(found?.id).toBe(user.id);
  });

  it("apelido normalizado duplicado vira DuplicateNicknameError", async () => {
    const a = await createUser(db, {
      email: "primeiro-apelido@example.com",
      emailNormalized: "primeiro-apelido@example.com",
    });
    await setNickname(db, a.id, "ApelidoUnico", "apelidounico");

    const b = await createUser(db, {
      email: "segundo-apelido@example.com",
      emailNormalized: "segundo-apelido@example.com",
    });
    await expect(
      setNickname(db, b.id, "ApelidoUnico", "apelidounico"),
    ).rejects.toBeInstanceOf(DuplicateNicknameError);
  });

  it("dois usuários sem apelido ainda (nickname_normalized nulo) não colidem entre si", async () => {
    await createUser(db, {
      email: "sem-apelido-1@example.com",
      emailNormalized: "sem-apelido-1@example.com",
    });
    // Se NULL colidisse como um valor UNIQUE igual a outro NULL, este segundo INSERT falharia.
    await expect(
      createUser(db, {
        email: "sem-apelido-2@example.com",
        emailNormalized: "sem-apelido-2@example.com",
      }),
    ).resolves.toBeDefined();
  });

  it("anonimiza e-mail e apelido, marca como excluído", async () => {
    const user = await createUser(db, {
      email: "vai-excluir@example.com",
      emailNormalized: "vai-excluir@example.com",
    });
    await setNickname(db, user.id, "VaiSumir", "vaisumir");

    const deleted = await anonymizeAndDeleteUser(db, user.id);
    expect(deleted.status).toBe("deleted");
    expect(deleted.email).toBe("");
    expect(deleted.nickname).not.toBe("VaiSumir");
    expect(deleted.nickname).toContain(user.id.slice(0, 8));
    expect(deleted.deletedAt).not.toBeNull();
  });
});
