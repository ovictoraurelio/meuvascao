import { expect, test } from "@playwright/test";

const environment = process.env.E2E_ENVIRONMENT ?? "development";
test.skip(
  environment === "development",
  "Public signup closure applies outside development",
);

for (const action of ["leads.cadastrar", "identidade.pedirLinkMagico"]) {
  test(`${action} refuses even empty input before validation`, async ({
    request,
    baseURL,
  }) => {
    if (!baseURL) throw new Error("Test server URL missing");
    const response = await request.post(`/_actions/${action}`, {
      headers: { Origin: baseURL },
      form: {},
    });
    expect(response.status()).toBe(503);
    expect(await response.text()).not.toContain("stack");
  });
}

for (const path of ["/", "/entrar"]) {
  test(`${path} remains readable without collecting contact details`, async ({
    request,
  }) => {
    const response = await request.get(path, {
      headers: { Cookie: "mv_session=arbitrary.signature" },
    });
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).not.toContain("<form");
    expect(html).not.toContain("turnstile/v0/api.js");
    expect(html).toContain('href="/privacidade"');
    expect(html).toContain("temporariamente indisponível");
  });
}
