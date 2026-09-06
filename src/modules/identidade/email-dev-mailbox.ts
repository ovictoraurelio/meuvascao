import type { Database } from "@/lib/db/client";

import {
  MAGIC_LINK_EMAIL_SUBJECT,
  type EmailSender,
  type MagicLinkEmail,
} from "./email-sender";
import { recordDevMailboxMessage } from "./mailbox.repo";

/** Fora de produção: em vez de enviar de verdade, grava em `dev_mailbox` para /dev/mailbox exibir. */
export function createDevMailboxSender(db: Database): EmailSender {
  return {
    async sendMagicLink({ to, link }: MagicLinkEmail): Promise<void> {
      await recordDevMailboxMessage(db, {
        to,
        subject: MAGIC_LINK_EMAIL_SUBJECT,
        body: `Clique para entrar: ${link}`,
        link,
      });
    },
  };
}
