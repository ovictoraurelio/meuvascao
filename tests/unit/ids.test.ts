import { describe, expect, it } from "vitest";

import { newId } from "@/lib/ids";

describe("newId", () => {
  it("gera um UUID v4 válido", () => {
    expect(newId()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("gera valores diferentes a cada chamada", () => {
    expect(newId()).not.toBe(newId());
  });
});
