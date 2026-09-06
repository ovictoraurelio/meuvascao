export interface MagicLinkEmail {
  to: string;
  link: string;
}

export interface EmailSender {
  sendMagicLink(email: MagicLinkEmail): Promise<void>;
}
