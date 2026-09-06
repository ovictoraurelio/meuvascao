// Palavras que ninguém escolhe como apelido: os próprios papéis internos, o nome da marca e
// termos genéricos de sistema — evita um apelido "Admin" ou "Meu Vascão" se passando por algo
// oficial num portal que se declara sem vínculo com o clube.
const RESERVED_NICKNAMES = [
  "admin",
  "administrador",
  "moderador",
  "editor",
  "torcedor",
  "sistema",
  "suporte",
  "vasco",
  "vascao",
  "meuvascao",
];

// Bloco Unicode "Combining Diacritical Marks" (U+0300–U+036F): o que sobra de um caractere
// acentuado depois do normalize("NFD") separar a letra base da marca (ex.: "ã" -> "a" + til).
// Filtrar por code point evita depender de digitar o próprio caractere combinante no código-fonte.
const COMBINING_DIACRITICAL_MARKS_START = 0x0300;
const COMBINING_DIACRITICAL_MARKS_END = 0x036f;

function stripCombiningDiacritics(text: string): string {
  return Array.from(text)
    .filter((char) => {
      const codePoint = char.codePointAt(0) ?? 0;
      return (
        codePoint < COMBINING_DIACRITICAL_MARKS_START ||
        codePoint > COMBINING_DIACRITICAL_MARKS_END
      );
    })
    .join("");
}

/** NFKC + minúsculas + sem diacríticos: chave de comparação para unicidade e palavras reservadas. */
export function normalizeNickname(nickname: string): string {
  return stripCombiningDiacritics(
    nickname.trim().normalize("NFKC").toLowerCase().normalize("NFD"),
  );
}

export function isReservedNickname(nickname: string): boolean {
  return RESERVED_NICKNAMES.includes(normalizeNickname(nickname));
}
