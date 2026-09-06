import { z } from "zod";

import type { Database } from "@/lib/db/client";
import { sha256Hex } from "@/lib/crypto/hash";
import { verifyTurnstileToken } from "@/lib/turnstile";

import { countRecentByIpHash, createLead, type Lead } from "./leads.repo";
import type { LeadChannel } from "./lead-value-normalize";

// Versão vigente da política de privacidade mostrada no consentimento — atualizar junto com
// content/paginas/privacidade (fatia F10) quando o texto mudar.
export const CURRENT_PRIVACY_VERSION = "2026-01-01";

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_PER_IP = 5;

const INVALID_CONTACT_MESSAGE = "Informe um e-mail ou telefone válido.";

/** Um único campo aceita e-mail ou WhatsApp (docs/02): o "@" decide qual dos dois é. */
export function detectLeadChannel(value: string): LeadChannel {
  return value.includes("@") ? "email" : "whatsapp";
}

function isValidContact(channel: LeadChannel, value: string): boolean {
  if (channel === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return value.replace(/\D/g, "").length >= 10;
}

export const leadInputSchema = z
  .object({
    value: z.string().trim().min(1, INVALID_CONTACT_MESSAGE).max(200),
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
    if (!isValidContact(detectLeadChannel(data.value), data.value)) {
      ctx.addIssue({
        code: "custom",
        path: ["value"],
        message: INVALID_CONTACT_MESSAGE,
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
    channel: detectLeadChannel(input.value),
    value: input.value,
    sourcePage: input.sourcePage,
    privacyVersion: CURRENT_PRIVACY_VERSION,
    ipHash,
  });
}
