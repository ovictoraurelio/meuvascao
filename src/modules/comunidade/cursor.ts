import { z } from "zod";
const cursorSchema = z.object({
  time: z.number().int().nonnegative(),
  id: z.string().min(1).max(100),
});
export function encodeCursor(time: number, id: string): string {
  return btoa(JSON.stringify({ time, id }));
}
export function decodeCursor(raw?: string | null) {
  if (!raw) return null;
  if (raw.length > 300) throw new Error("Cursor inválido.");
  return cursorSchema.parse(JSON.parse(atob(raw)));
}
