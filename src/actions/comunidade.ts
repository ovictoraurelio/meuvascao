import { ActionError, defineAction } from "astro:actions";
import { z } from "zod";
import { getRequestDb } from "@/lib/db/client";
import { comment, CommunityError, like, report } from "@/modules/comunidade";
async function translate<T>(operation: () => Promise<T>) {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof CommunityError)
      throw new ActionError({ code: error.code, message: error.message });
    if (error instanceof z.ZodError)
      throw new ActionError({
        code: "BAD_REQUEST",
        message: z.prettifyError(error),
      });
    throw new ActionError({
      code: "INTERNAL_SERVER_ERROR",
      message:
        "Não foi possível concluir. Seu rascunho foi mantido; tente novamente.",
    });
  }
}
export const comunidade = {
  comentar: defineAction({
    accept: "form",
    handler: async (form, context) =>
      translate(async () => {
        const result = await comment(getRequestDb(), context.locals.session, {
          matchId: form.get("matchId"),
          body: form.get("body"),
          parentId: form.get("parentId") || undefined,
          idempotencyKey: form.get("idempotencyKey"),
          turnstileToken: form.get("cf-turnstile-response"),
        });
        return { id: result.id };
      }),
  }),
  curtir: defineAction({
    accept: "form",
    handler: async (form, context) =>
      translate(async () => {
        await like(
          getRequestDb(),
          context.locals.session,
          form.get("commentId"),
        );
        return { ok: true };
      }),
  }),
  denunciar: defineAction({
    accept: "form",
    handler: async (form, context) =>
      translate(async () => {
        await report(getRequestDb(), context.locals.session, {
          commentId: form.get("commentId"),
          reason: form.get("reason"),
        });
        return { ok: true };
      }),
  }),
};
