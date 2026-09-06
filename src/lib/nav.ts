// Barra inferior (docs/02:29): quatro destinos fixos na v1. Notícias entra pela home; busca fica
// para quando o acervo justificar (docs/02:29) — nenhum dos dois ganha item aqui.
export const NAV = [
  { key: "inicio", href: "/", label: "Início" },
  { key: "jogos", href: "/jogos", label: "Jogos" },
  { key: "resenha", href: "/resenha", label: "Resenha" },
  { key: "perfil", href: "/perfil", label: "Perfil" },
] as const;

export type NavKey = (typeof NAV)[number]["key"];
