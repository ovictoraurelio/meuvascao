export type LeadChannel = "email" | "whatsapp";

// Normaliza o valor de contato para deduplicação: e-mail vira minúsculo e sem espaço nas pontas;
// WhatsApp fica só com dígitos, então "+55 (21) 99999-9999", "5521999999999" e "21 99999 9999"
// (mesmo número, formatos diferentes) normalizam para o mesmo valor.
export function normalizeLeadValue(
  channel: LeadChannel,
  rawValue: string,
): string {
  if (channel === "email") return rawValue.trim().toLowerCase();
  return rawValue.replace(/\D/g, "");
}
