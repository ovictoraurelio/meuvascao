import { describe, expect, it } from "vitest";

import {
  base64UrlToText,
  hmacSign,
  hmacVerify,
  textToBase64Url,
} from "@/lib/crypto/hmac";

describe("textToBase64Url / base64UrlToText", () => {
  it("é reversível para texto com acento", () => {
    const original = '{"sid":"abc","uid":"João","exp":123}';
    expect(base64UrlToText(textToBase64Url(original))).toBe(original);
  });

  it("não usa caracteres não seguros para URL (+, /, =)", () => {
    // String escolhida para produzir bytes que dariam +, / ou = em base64 padrão.
    const encoded = textToBase64Url("ÿþýüû");
    expect(encoded).not.toMatch(/[+/=]/);
  });
});

describe("hmacSign / hmacVerify", () => {
  it("verifica uma assinatura válida", async () => {
    const signature = await hmacSign("segredo-de-teste", "dados");
    expect(await hmacVerify("segredo-de-teste", "dados", signature)).toBe(true);
  });

  it("rejeita quando os dados foram alterados", async () => {
    const signature = await hmacSign("segredo-de-teste", "dados-originais");
    expect(
      await hmacVerify("segredo-de-teste", "dados-alterados", signature),
    ).toBe(false);
  });

  it("rejeita quando o segredo é outro", async () => {
    const signature = await hmacSign("segredo-a", "dados");
    expect(await hmacVerify("segredo-b", "dados", signature)).toBe(false);
  });

  it("rejeita uma assinatura malformada sem lançar", async () => {
    expect(await hmacVerify("segredo", "dados", "!!!não-é-base64!!!")).toBe(
      false,
    );
  });
});
