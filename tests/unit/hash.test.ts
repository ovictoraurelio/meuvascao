import { describe, expect, it } from "vitest";

import { sha256Hex } from "@/lib/crypto/hash";

describe("sha256Hex", () => {
  it("produz o SHA-256 conhecido de uma string vazia", async () => {
    expect(await sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("produz o mesmo hash para a mesma entrada", async () => {
    expect(await sha256Hex("203.0.113.42")).toBe(
      await sha256Hex("203.0.113.42"),
    );
  });

  it("produz hashes diferentes para entradas diferentes", async () => {
    expect(await sha256Hex("203.0.113.42")).not.toBe(
      await sha256Hex("203.0.113.43"),
    );
  });

  it("nunca inclui a entrada original no resultado", async () => {
    const ip = "203.0.113.42";
    expect(await sha256Hex(ip)).not.toContain(ip);
  });
});
