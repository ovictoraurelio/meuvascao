// América/São_Paulo (BRT/Brasília) não observa horário de verão desde 2019: um único offset fixo
// simplificaria, mas usar o Intl com o nome do fuso deixa a data à prova de uma futura mudança
// legal, sem precisar tocar neste arquivo.
const FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Formata um instante UTC como horário de Brasília: "13/09, 18h30 (Brasília)". */
export function formatBRT(date: Date): string {
  const parts = Object.fromEntries(
    FORMATTER.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return `${parts.day}/${parts.month}, ${parts.hour}h${parts.minute} (Brasília)`;
}
