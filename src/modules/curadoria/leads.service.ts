import { z } from "zod";

import type { Database } from "@/lib/db/client";
import { sha256Hex } from "@/lib/crypto/hash";
import { verifyTurnstileToken } from "@/lib/turnstile";

import { countRecentByIpHash, createLead, type Lead } from "./leads.repo";

// Versão vigente da política de privacidade mostrada no consentimento — atualizar junto com
// content/paginas/privacidade (fatia F10) quando o texto mudar.
export const CURRENT_PRIVACY_VERSION = "2026-01-01";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_PER_IP = 5;

export const leadInputSchema = z
  .object({
    channel: z.enum(["email", "whatsapp"]),
    value: z.string().trim().min(1).max(200),
    sourcePage: z.string().min(1).max(200),
    consent: z.boolean(),
    // Campo armadilha: só um bot preenche um input que o CSS esconde do usuário real. Sem limite
    // de tamanho aqui de propósito — quem decide o que fazer com um valor não vazio é o serviço
    // (sucesso fingido), não uma rejeição de validação que se pareceria com qualquer outro erro.
    honeypot: z.string().optional().default(""),
    turnstileToken: z.string().min(1, "Confirme que você não é um robô."),
  })
  .superRefine((data, ctx) => {
    if (!data.consent) {
      ctx.addIssue({
        code: "custom",
        path: ["consent"],
        message: "É preciso aceitar para continuar.",
      });
    }
    if (
      data.channel === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.value)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Informe um e-mail válido.",
      });
    }
    if (
      data.channel === "whatsapp" &&
      data.value.replace(/\D/g, "").length < 10
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: "Informe um WhatsApp válido, com DDD.",
      });
    }
  });

export type LeadInput = z.infer<typeof leadInputSchema>;

/** Preenchido pelo bot que segue rótulos de formulário sem executar CSS/JS — sucesso fingido. */
export class HoneypotTrippedError extends Error {}

export class TurnstileFailedError extends Error {}

export class RateLimitedError extends Error {}

export interface RegisterLeadContext {
  db: Database;
  ip: string;
}

export async function registerLead(
  { db, ip }: RegisterLeadContext,
  input: LeadInput,
): Promise<Lead> {
  if (input.honeypot) throw new HoneypotTrippedError();

  if (!(await verifyTurnstileToken(input.turnstileToken, ip))) {
    throw new TurnstileFailedError();
  }

  const ipHash = await sha256Hex(ip);
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recent = await countRecentByIpHash(db, ipHash, since);
  if (recent >= RATE_LIMIT_MAX_PER_IP) throw new RateLimitedError();

  return createLead(db, {
    channel: input.channel,
    value: input.value,
    sourcePage: input.sourcePage,
    privacyVersion: CURRENT_PRIVACY_VERSION,
    ipHash,
  });
}
