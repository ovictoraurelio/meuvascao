import { ActionError, defineAction } from "astro:actions";
import { z } from "zod";
import { getRequestDb } from "@/lib/db/client";
import {
  AdminAccessError,
  exportLeads,
  saveLink,
  saveMatch,
  withdrawLink,
} from "@/modules/administracao";
import { isUniqueConstraintError } from "@/lib/db/errors";

async function translate<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AdminAccessError)
      throw new ActionError({ code: "FORBIDDEN", message: error.message });
    if (error instanceof z.ZodError)
      throw new ActionError({
        code: "BAD_REQUEST",
        message: z.prettifyError(error),
      });
    if (isUniqueConstraintError(error))
      throw new ActionError({
        code: "CONFLICT",
        message: "Este endereço já está cadastrado.",
      });
    throw new ActionError({
      code: "BAD_REQUEST",
      message: "Não foi possível salvar. Confira os dados e tente novamente.",
    });
  }
}
function input(form: FormData) {
  const values = Object.fromEntries(form);
  if (!values.id) delete values.id;
  return values;
}
export const admin = {
  salvarJogo: defineAction({
    accept: "form",
    handler: async (form, context) =>
      translate(async () => {
        const match = await saveMatch(
          getRequestDb(),
          context.locals.session,
          input(form),
        );
        return { slug: match.slug };
      }),
  }),
  publicarLink: defineAction({
    accept: "form",
    handler: async (form, context) =>
      translate(async () => {
        const link = await saveLink(
          getRequestDb(),
          context.locals.session,
          input(form),
        );
        return { id: link.id };
      }),
  }),
  retirarLink: defineAction({
    accept: "form",
    handler: async (form, context) =>
      translate(async () => {
        await withdrawLink(
          getRequestDb(),
          context.locals.session,
          form.get("id"),
        );
        return { ok: true };
      }),
  }),
  exportarLeads: defineAction({
    accept: "form",
    handler: async (_form, context) =>
      translate(async () => ({
        csv: await exportLeads(getRequestDb(), context.locals.session),
      })),
  }),
};
