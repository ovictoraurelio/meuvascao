import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { getDb } from "@/lib/db/client";
import {
  createLink,
  DuplicateLinkError,
  listPublishedBySlot,
} from "@/modules/curadoria/links.repo";

describe("links.repo: URL duplicada após normalização é rejeitada", () => {
  const db = getDb(env.DB);

  it("aceita o primeiro cadastro e rejeita o segundo com a mesma URL normalizada", async () => {
    await createLink(db, {
      url: "https://Globo.com/noticia?utm_source=whatsapp",
      title: "Vasco vence de virada",
      sourceName: "GloboEsporte",
      label: "noticia",
      slot: "ultimas",
      position: 1,
      curatedBy: "editor-1",
    });

    await expect(
      createLink(db, {
        // Mesma URL depois de normalizada (host minúsculo já bate; utm_* é removido em ambas).
        url: "https://globo.com/noticia?utm_source=instagram&utm_campaign=x",
        title: "Vasco vence de virada (repost)",
        sourceName: "GloboEsporte",
        label: "noticia",
        slot: "ultimas",
        position: 2,
        curatedBy: "editor-1",
      }),
    ).rejects.toBeInstanceOf(DuplicateLinkError);
  });

  it("um link com URL diferente é aceito normalmente", async () => {
    const link = await createLink(db, {
      url: "https://ge.globo.com/outra-materia",
      title: "Outra matéria",
      sourceName: "GloboEsporte",
      label: "opiniao",
      slot: "em1minuto",
      position: 1,
      curatedBy: "editor-1",
    });
    expect(link.status).toBe("publicado");
  });

  it("listPublishedBySlot só traz links publicados do slot pedido, em ordem de posição", async () => {
    const emUmMinuto = await listPublishedBySlot(db, "em1minuto");
    expect(emUmMinuto.map((l) => l.title)).toEqual(["Outra matéria"]);
  });
});
