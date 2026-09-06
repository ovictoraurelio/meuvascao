/** CSV destinado a planilhas: texto com prefixo de fórmula fica explicitamente literal. */
export function csvCell(value: string): string {
  const safe =
    /^[\s]*[=+@-]/.test(value) || /^[\t\r\n]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}
