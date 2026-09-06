import { z } from "zod";
const text = z.string().trim().min(1).max(200);
const optionalText = z.string().trim().max(1000).default("");
const https = z
  .url()
  .refine(
    (value) => new URL(value).protocol === "https:",
    "Use uma URL https.",
  );
const score = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z.coerce.number().int().min(0).max(99).optional(),
);
export const matchInput = z
  .object({
    id: z.guid().optional(),
    opponentName: text,
    competition: text,
    homeAway: z.enum(["casa", "fora", "neutro"]).default("casa"),
    kickoffAt: z
      .string()
      .default("")
      .refine(
        (value) =>
          !value ||
          (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value) &&
            Number.isFinite(Date.parse(`${value}:00Z`)) &&
            new Date(`${value}:00Z`).toISOString().slice(0, 16) === value),
        "Horário inválido.",
      ),
    venue: optionalText,
    round: optionalText,
    notes: optionalText,
    status: z
      .enum(["agendado", "indefinido", "adiado", "encerrado", "cancelado"])
      .default("indefinido"),
    scoreVasco: score,
    scoreOpponent: score,
    sourceName: text,
    sourceUrl: https,
  })
  .superRefine((input, ctx) => {
    if (
      input.status === "encerrado" &&
      (input.scoreVasco === undefined || input.scoreOpponent === undefined)
    )
      ctx.addIssue({
        code: "custom",
        message: "Informe os dois placares.",
        path: ["scoreVasco"],
      });
    if (input.status === "agendado" && !input.kickoffAt)
      ctx.addIssue({
        code: "custom",
        message: "Informe o horário de Brasília ou marque horário indefinido.",
        path: ["kickoffAt"],
      });
  });
export const linkInput = z.object({
  id: z.guid().optional(),
  url: https,
  title: text,
  sourceName: text,
  label: z.enum(["noticia", "opiniao", "rumor", "video", "podcast"]),
  slot: z.enum(["em1minuto", "ultimas"]),
  position: z.coerce.number().int().min(0).max(9999),
});
export type MatchInput = z.infer<typeof matchInput>;
export type LinkInput = z.infer<typeof linkInput>;
