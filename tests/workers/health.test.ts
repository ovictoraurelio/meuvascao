import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("bindings do ambiente de teste", () => {
  it("D1 responde a uma consulta", async () => {
    const row = await env.DB.prepare("SELECT 1 AS um").first<{ um: number }>();
    expect(row?.um).toBe(1);
  });

  it("variáveis públicas estão presentes", () => {
    expect(env.ENVIRONMENT).toBe("development");
    expect(env.SITE_URL).toMatch(/^http/);
  });
});
