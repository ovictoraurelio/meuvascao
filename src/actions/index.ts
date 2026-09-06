import { ActionError, defineAction } from "astro:actions";
import { z } from "zod";

import { getRequestDb } from "@/lib/db/client";
import { safeRedirectTarget } from "@/lib/http/redirect-safe";
import {
  DuplicateLeadError,
  HoneypotTrippedError,
  leadInputSchema,
  RateLimitedError as LeadRateLimitedError,
  registerLead,
  TurnstileFailedError as LeadTurnstileFailedError,
} from "@/modules/curadoria";
import {
  chooseNickname,
  chooseNicknameSchema,
  deleteOwnAccount,
  DuplicateNicknameError,
  getAuthenticatedUser,
  RateLimitedError as MagicLinkRateLimitedError,
  requestMagicLink,
  requestMagicLinkSchema,
  requireNotSuspended,
  ReservedNicknameError,
  revokeAllSessionsForUser,
  SESSION_COOKIE_NAME,
  SuspendedAccountError,
  TurnstileFailedError as MagicLinkTurnstileFailedError,
} from "@/modules/identidade";

const SESSION_INVALID_MESSAGE =
  "Sua sessão não é mais válida. Peça um novo link de acesso.";

// Astro Actions embrulha toda escrita (docs/03): formulário funciona sem JS (POST comum, o
// resultado volta via Astro.getActionResult) e `security.checkOrigin` (astro.config.ts) já
// rejeita um POST cuja Origin não seja a do próprio site — é a proteção contra CSRF.
export const server = {
  leads: {
    cadastrar: defineAction({
      accept: "form",
      handler: async (formData, context) => {
        // O widget do Turnstile grava o token num campo próprio (`cf-turnstile-response`), não
        // num nome que o schema Zod escolheria — por isso o parsing manual em vez de deixar o
        // Astro casar FormData com o schema pelo nome de cada chave.
        //
        // honeypot só vira string aqui: um bot que submete esse campo como parte de arquivo
        // (FormData.get devolve um File, não null) não pode fazer a validação falhar de um jeito
        // que revele a armadilha — o objetivo é sempre cair no sucesso fingido do serviço.
        const honeypotValue = formData.get("honeypot");
        const raw = {
          value: formData.get("value"),
          sourcePage: formData.get("sourcePage"),
          consent: formData.get("consent") === "on",
          honeypot: typeof honeypotValue === "string" ? honeypotValue : "",
          turnstileToken: formData.get("cf-turnstile-response") ?? "",
        };

        const parsed = leadInputSchema.safeParse(raw);
        if (!parsed.success) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: z.prettifyError(parsed.error),
          });
        }

        const db = getRequestDb();
        const ip = context.clientAddress || "0.0.0.0";

        try {
          await registerLead({ db, ip }, parsed.data);
          return { ok: true as const };
        } catch (error) {
          // Bot pego pela armadilha: sucesso fingido, nunca revela que foi detectado.
          if (error instanceof HoneypotTrippedError)
            return { ok: true as const };
          if (error instanceof LeadTurnstileFailedError) {
            throw new ActionError({
              code: "FORBIDDEN",
              message: "Confirme que você não é um robô e tente de novo.",
            });
          }
          if (error instanceof LeadRateLimitedError) {
            throw new ActionError({
              code: "TOO_MANY_REQUESTS",
              message:
                "Muitos cadastros em pouco tempo. Tente novamente mais tarde.",
            });
          }
          if (error instanceof DuplicateLeadError) {
            throw new ActionError({
              code: "CONFLICT",
              message: "Este contato já está cadastrado.",
            });
          }
          throw error;
        }
      },
    }),
  },
  identidade: {
    pedirLinkMagico: defineAction({
      accept: "form",
      handler: async (formData, context) => {
        const raw = {
          email: formData.get("email"),
          redirect: formData.get("redirect") || undefined,
          turnstileToken: formData.get("cf-turnstile-response") ?? "",
        };
        const parsed = requestMagicLinkSchema.safeParse(raw);
        if (!parsed.success) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: z.prettifyError(parsed.error),
          });
        }

        const db = getRequestDb();
        const ip = context.clientAddress || null;
        // A origem da própria requisição, não getEnv().SITE_URL: o link precisa trazer quem
        // clicar de volta para o host/porta onde a pessoa está de fato (preview de PR, porta
        // alternativa do E2E) — SITE_URL é fixo por ambiente e nem sempre é o mesmo.
        const siteUrl = context.url.origin;

        try {
          await requestMagicLink({ db, ip, siteUrl }, parsed.data);
          return { ok: true as const };
        } catch (error) {
          if (error instanceof MagicLinkTurnstileFailedError) {
            throw new ActionError({
              code: "FORBIDDEN",
              message: "Confirme que você não é um robô e tente de novo.",
            });
          }
          if (error instanceof MagicLinkRateLimitedError) {
            throw new ActionError({
              code: "TOO_MANY_REQUESTS",
              message:
                "Muitos pedidos em pouco tempo. Tente novamente mais tarde.",
            });
          }
          throw error;
        }
      },
    }),
    escolherApelido: defineAction({
      accept: "form",
      handler: async (formData, context) => {
        const raw = {
          nickname: formData.get("nickname"),
          redirect: formData.get("redirect") || undefined,
        };
        const parsed = chooseNicknameSchema.safeParse(raw);
        if (!parsed.success) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: z.prettifyError(parsed.error),
          });
        }

        const db = getRequestDb();
        const authenticated = await getAuthenticatedUser(
          db,
          context.locals.session,
        );
        if (!authenticated) {
          throw new ActionError({
            code: "UNAUTHORIZED",
            message: SESSION_INVALID_MESSAGE,
          });
        }
        try {
          requireNotSuspended(authenticated.user);
          await chooseNickname(db, authenticated.user.id, parsed.data.nickname);
          // O redirect volta pelo próprio resultado da action, não pela query string da página:
          // o bounce-back de uma action com accept:"form" não preserva a query string de onde o
          // formulário foi enviado, então a página não teria como recuperar o valor sozinha.
          return {
            ok: true as const,
            redirect: safeRedirectTarget(parsed.data.redirect ?? null),
          };
        } catch (error) {
          if (error instanceof DuplicateNicknameError) {
            throw new ActionError({
              code: "CONFLICT",
              message: "Esse apelido já está em uso.",
            });
          }
          if (error instanceof ReservedNicknameError) {
            throw new ActionError({
              code: "CONFLICT",
              message: "Esse apelido não pode ser usado.",
            });
          }
          if (error instanceof SuspendedAccountError) {
            throw new ActionError({
              code: "FORBIDDEN",
              message: "Conta suspensa.",
            });
          }
          throw error;
        }
      },
    }),
    excluirConta: defineAction({
      accept: "form",
      handler: async (_formData, context) => {
        const db = getRequestDb();
        const authenticated = await getAuthenticatedUser(
          db,
          context.locals.session,
        );
        if (!authenticated) {
          throw new ActionError({
            code: "UNAUTHORIZED",
            message: SESSION_INVALID_MESSAGE,
          });
        }
        // Diferente de toda outra escrita: exclusão da própria conta é permitida mesmo suspensa
        // (direito da pessoa, não uma ação na comunidade que a suspensão deveria bloquear).
        await deleteOwnAccount(db, authenticated.user.id);
        await revokeAllSessionsForUser(db, authenticated.user.id);
        context.cookies.delete(SESSION_COOKIE_NAME, { path: "/" });
        return { ok: true as const };
      },
    }),
  },
};
