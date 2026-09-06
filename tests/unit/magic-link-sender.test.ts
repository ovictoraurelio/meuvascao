import { beforeEach, expect, it, vi } from "vitest";

const { bindings, send } = vi.hoisted(() => ({
  bindings: { ENVIRONMENT: "preview", RESEND_API_KEY: "configured-for-test" },
  send: vi.fn(),
}));
vi.mock("cloudflare:workers", () => ({ env: bindings }));
vi.mock("@/lib/turnstile", () => ({ verifyTurnstileToken: async () => true }));
vi.mock("@/modules/identidade/tokens.repo", () => ({
  reserveAuthToken: async () => true,
  consumeAuthToken: vi.fn(),
}));
vi.mock("@/modules/identidade/email-dev-mailbox", () => ({
  createDevMailboxSender: () => {
    throw new Error("Mailbox não pode ser selecionada no preview");
  },
}));
vi.mock("@/modules/identidade/email-resend", () => ({
  createResendSender: (key: string) => ({
    sendMagicLink: (message: unknown) => send(key, message),
  }),
}));
import type { Database } from "@/lib/db/client";
import { requestMagicLink } from "@/modules/identidade/magic-link";

beforeEach(() => vi.clearAllMocks());
it("preview entrega o link por Resend, nunca em uma mailbox inacessível", async () => {
  await requestMagicLink(
    {
      db: {} as Database,
      ip: "203.0.113.1",
      siteUrl: "https://preview.meuvascao.com",
    },
    {
      email: "torcedor@example.com",
      turnstileToken: "test",
    },
  );
  expect(send).toHaveBeenCalledWith("configured-for-test", {
    to: "torcedor@example.com",
    link: expect.stringMatching(
      /^https:\/\/preview.meuvascao.com\/entrar\/confirmar\?token=/,
    ),
  });
});
