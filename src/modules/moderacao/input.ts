import { z } from "zod";

const reason = z.string().trim().min(3).max(1000);
const id = z.guid();
const booleanInput = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((value) => value === true || value === "true");
export const reasonInput = z.object({ id, reason });
export const suspensionInput = reasonInput.extend({ suspended: booleanInput });
export const slowModeInput = reasonInput.extend({
  seconds: z
    .union([z.number(), z.string().trim().regex(/^\d+$/).transform(Number)])
    .pipe(z.number().int().min(0).max(3600)),
});
export const threadClosedInput = reasonInput.extend({ closed: booleanInput });
export const writingClosedInput = z.object({ closed: booleanInput, reason });
