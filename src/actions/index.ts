import { ActionError, defineAction } from "astro:actions";
import { z } from "zod";

import { getDb } from "@/lib/db/client";
import { getEnv } from "@/lib/env";
import {
  DuplicateLeadError,
  HoneypotTrippedError,
  leadInputSchema,
  RateLimitedError,
  registerLead,
  TurnstileFailedError,
} from "@/modules/curadoria";

// Astro Actions embrulha toda escrita (docs/03): formulário funciona sem JS (POST comum, o
// resultado volta via Astro.getActionResult) e `security.checkOrigin` (astro.config.ts) já
// rejeita um POST cuja Origin não seja a do próprio site — é a proteção contra CSRF.
export const server = {
  leads: {
    cadastrar: defineAction({
      accept: "form",
      handler: async (formData, context) => {
        if (!(formData instanceof FormData)) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "Formulário inválido.",
          });
        }

        // O widget do Turnstile grava o token num campo próprio (`cf-turnstile-response`), não
        // num nome que o schema Zod escolheria — por isso o parsing manual em vez de deixar o
        // Astro casar FormData com o schema pelo nome de cada chave.
        const raw = {
          value: formData.get("value"),
          sourcePage: formData.get("sourcePage"),
          consent: formData.get("consent") === "on",
          honeypot: formData.get("honeypot") ?? "",
          turnstileToken: formData.get("cf-turnstile-response") ?? "",
        };

        const parsed = leadInputSchema.safeParse(raw);
        if (!parsed.success) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: z.prettifyError(parsed.error),
          });
        }

        const db = getDb(getEnv().DB);
        const ip = context.clientAddress || "0.0.0.0";

        try {
          await registerLead({ db, ip }, parsed.data);
          return { ok: true as const };
        } catch (error) {
          // Bot pego pela armadilha: sucesso fingido, nunca revela que foi detectado.
          if (error instanceof HoneypotTrippedError)
            return { ok: true as const };
          if (error instanceof TurnstileFailedError) {
            throw new ActionError({
              code: "FORBIDDEN",
              message: "Confirme que você não é um robô e tente de novo.",
            });
          }
          if (error instanceof RateLimitedError) {
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
};
