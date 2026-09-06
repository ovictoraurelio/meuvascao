export type LeadChannel = "email" | "whatsapp";

// Normaliza o valor de contato para deduplicação: e-mail vira minúsculo e sem espaço nas pontas;
// WhatsApp fica só com dígitos, então duas formatações do mesmo número COM o mesmo prefixo (ex.:
// "+55 (21) 99999-9999" e "5521999999999") normalizam igual. Presença ou ausência do DDI/DDD
// continua produzindo valores diferentes — não é normalização de número de telefone, só remoção
// de formatação (espaço, parênteses, hífen).
export function normalizeLeadValue(
  channel: LeadChannel,
  rawValue: string,
): string {
  if (channel === "email") return rawValue.trim().toLowerCase();
  return rawValue.replace(/\D/g, "");
}
