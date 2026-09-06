import {
  MAGIC_LINK_EMAIL_SUBJECT,
  type EmailSender,
  type MagicLinkEmail,
} from "./email-sender";

const RESEND_API_URL = "https://api.resend.com/emails";
// Domínio verificado na Cloudflare (SPF/DKIM/DMARC) é responsabilidade do fundador (runbook);
// aqui só o endereço "de" combinado com esse domínio.
const FROM_ADDRESS = "Meu Vascão <resenha@meuvascao.com>";

export class ResendSendError extends Error {}

/** Produção só: envia via REST da Resend, autenticado por RESEND_API_KEY (`wrangler secret put`). */
export function createResendSender(apiKey: string): EmailSender {
  if (!apiKey.trim())
    throw new ResendSendError("Envio de e-mail não configurado.");
  return {
    async sendMagicLink({ to, link }: MagicLinkEmail): Promise<void> {
      const res = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to,
          subject: MAGIC_LINK_EMAIL_SUBJECT,
          text: `Clique para entrar: ${link}`,
        }),
      });
      if (!res.ok) {
        throw new ResendSendError(
          `Resend respondeu ${res.status} ao enviar o link mágico`,
        );
      }
    },
  };
}
