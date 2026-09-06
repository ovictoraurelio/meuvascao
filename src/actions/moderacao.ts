import { ActionError, defineAction } from "astro:actions";
import { z } from "zod";
import { getRequestDb } from "@/lib/db/client";
import { AdminAccessError } from "@/modules/administracao";
import {
  hideComment,
  setUserSuspended,
  setSlowMode,
  setThreadClosed,
  setWritingClosed,
  resolveReport,
  ModerationTargetError,
} from "@/modules/moderacao";

function action(operation: typeof hideComment) {
  return defineAction({
    accept: "form",
    handler: async (form, context) => {
      try {
        await operation(
          getRequestDb(),
          context.locals.session,
          Object.fromEntries(form),
        );
        return { ok: true };
      } catch (error) {
        if (error instanceof AdminAccessError)
          throw new ActionError({ code: "FORBIDDEN", message: error.message });
        if (error instanceof z.ZodError)
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "Preencha o motivo e confira os dados da decisão.",
          });
        if (error instanceof ModerationTargetError)
          throw new ActionError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Não foi possível registrar a decisão. Tente novamente.",
        });
      }
    },
  });
}
export const moderacao = {
  ocultarComentario: action(hideComment),
  resolverDenuncia: action(resolveReport),
  definirSuspensao: action(setUserSuspended),
  definirModoLento: action(setSlowMode),
  definirThreadFechada: action(setThreadClosed),
  definirEscritaFechada: action(setWritingClosed),
};
