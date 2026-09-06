export const MAGIC_LINK_EMAIL_SUBJECT = "Seu link de acesso ao Meu Vascão";

export interface MagicLinkEmail {
  to: string;
  link: string;
}

export interface EmailSender {
  sendMagicLink(email: MagicLinkEmail): Promise<void>;
}
