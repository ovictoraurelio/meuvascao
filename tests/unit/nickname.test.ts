import { describe, expect, it } from "vitest";

import {
  isReservedNickname,
  normalizeNickname,
} from "@/modules/identidade/nickname";

describe("normalizeNickname", () => {
  it("minúsculas, sem espaço nas pontas e sem acento", () => {
    expect(normalizeNickname("  João Ção  ")).toBe("joao cao");
  });

  it("a mesma grafia em NFC e em NFD (letra + acento combinante) normaliza igual", () => {
    const nfc = "José";
    const nfd = nfc.normalize("NFD");
    expect(nfc).not.toBe(nfd); // formas realmente diferentes byte a byte
    expect(normalizeNickname(nfc)).toBe(normalizeNickname(nfd));
  });
});

describe("isReservedNickname", () => {
  it("rejeita papéis internos e a marca, com ou sem acento/maiúsculas", () => {
    expect(isReservedNickname("Admin")).toBe(true);
    expect(isReservedNickname("VASCÃO")).toBe(true);
    expect(isReservedNickname("Moderador")).toBe(true);
  });

  it("aceita um apelido comum", () => {
    expect(isReservedNickname("Cartoleiro")).toBe(false);
  });
});
