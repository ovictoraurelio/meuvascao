import { expect, it } from "vitest";
import { csvCell } from "@/modules/administracao/csv";
it("neutraliza fórmulas inclusive com espaços/tab e escapa aspas", () => {
  expect(csvCell('=HYPERLINK("evil")')).toBe('"\'=HYPERLINK(""evil"")"');
  for (const prefix of ["+", "-", "@", "\t=", "  =", "\r="])
    expect(csvCell(`${prefix}cmd`)).toMatch(/^"'/);
  expect(csvCell('a,"b')).toBe('"a,""b"');
});
