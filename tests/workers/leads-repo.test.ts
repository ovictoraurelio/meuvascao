import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

import { getDb } from "@/lib/db/client";
import { createLead, DuplicateLeadError } from "@/modules/curadoria/leads.repo";

describe("leads.repo: lead duplicado é rejeitado", () => {
  const db = getDb(env.DB);

  it("aceita o primeiro cadastro e rejeita o mesmo e-mail em outra capitalização", async () => {
    await createLead(db, {
      channel: "email",
      value: "Torcedor@Example.com",
      sourcePage: "/",
      privacyVersion: "2026-01-01",
      ipHash: "hash-1",
    });

    await expect(
      createLead(db, {
        channel: "email",
        value: "  torcedor@example.com  ",
        sourcePage: "/jogos/vasco-x-flamengo",
        privacyVersion: "2026-01-01",
        ipHash: "hash-2",
      }),
    ).rejects.toBeInstanceOf(DuplicateLeadError);
  });

  it("aceita o mesmo número de WhatsApp em formatação diferente só na primeira vez", async () => {
    await createLead(db, {
      channel: "whatsapp",
      value: "(21) 99999-9999",
      sourcePage: "/",
      privacyVersion: "2026-01-01",
      ipHash: "hash-3",
    });

    await expect(
      createLead(db, {
        channel: "whatsapp",
        value: "21999999999",
        sourcePage: "/",
        privacyVersion: "2026-01-01",
        ipHash: "hash-4",
      }),
    ).rejects.toBeInstanceOf(DuplicateLeadError);
  });

  it("um e-mail e um WhatsApp diferentes são aceitos normalmente", async () => {
    const lead = await createLead(db, {
      channel: "email",
      value: "outro-torcedor@example.com",
      sourcePage: "/",
      privacyVersion: "2026-01-01",
      ipHash: "hash-5",
    });
    expect(lead.valueNormalized).toBe("outro-torcedor@example.com");
  });
});
