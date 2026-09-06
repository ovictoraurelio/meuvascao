import { ActionError, defineAction } from "astro:actions";
import { z } from "zod";

import { getRequestDb } from "@/lib/db/client";
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
