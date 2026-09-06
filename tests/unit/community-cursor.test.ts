import { expect, it } from "vitest";
import { decodeCursor, encodeCursor } from "@/modules/comunidade/cursor";
it("cursor composto preserva desempate e rejeita entrada inválida", () => {
  expect(decodeCursor(encodeCursor(100, "id-a"))).toEqual({
    time: 100,
    id: "id-a",
  });
  for (const raw of ["invalid", btoa('{"time":-1,"id":"x"}'), "x".repeat(400)])
    expect(() => decodeCursor(raw)).toThrow();
});
