import type { Database } from "@/lib/db/client";

import type { EmailSender, MagicLinkEmail } from "./email-sender";
import { recordDevMailboxMessage } from "./mailbox.repo";

const SUBJECT = "Seu link de acesso ao Meu Vascão";

/** Fora de produção: em vez de enviar de verdade, grava em `dev_mailbox` para /dev/mailbox exibir. */
export function createDevMailboxSender(db: Database): EmailSender {
  return {
    async sendMagicLink({ to, link }: MagicLinkEmail): Promise<void> {
      await recordDevMailboxMessage(db, {
        to,
        subject: SUBJECT,
        body: `Clique para entrar: ${link}`,
        link,
      });
    },
  };
}
