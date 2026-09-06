import { asc, eq } from "drizzle-orm";
import type { Database } from "@/lib/db/client";
import { comments, reactions, reports } from "@/lib/db/schema";

/** Dados do titular autenticado. Não inclui textos de terceiros nem metadados internos de sessão. */
export async function exportOwnCommunityData(db: Database, userId: string) {
  const [ownComments, ownReactions, ownReports] = await db.batch([
    db
      .select({
        id: comments.id,
        resenha: comments.threadId,
        respostaA: comments.parentId,
        texto: comments.body,
        estado: comments.status,
        criadaEm: comments.createdAt,
      })
      .from(comments)
      .where(eq(comments.authorId, userId))
      .orderBy(asc(comments.createdAt), asc(comments.id)),
    db
      .select({
        comentario: reactions.commentId,
        criadaEm: reactions.createdAt,
      })
      .from(reactions)
      .where(eq(reactions.userId, userId))
      .orderBy(asc(reactions.createdAt)),
    db
      .select({
        comentario: reports.commentId,
        motivo: reports.reason,
        estado: reports.status,
        criadaEm: reports.createdAt,
      })
      .from(reports)
      .where(eq(reports.reporterId, userId))
      .orderBy(asc(reports.createdAt)),
  ]);
  return {
    comentarios: ownComments,
    curtidas: ownReactions,
    denuncias: ownReports,
  };
}
