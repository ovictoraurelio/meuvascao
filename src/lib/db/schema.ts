import { sql } from "drizzle-orm";
import {
  check,
  index,
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

// Esquema Drizzle do Meu Vascão (dialeto SQLite/D1), migração 0001_fundacao.
//
// Regras de portabilidade para um eventual Postgres (ver docs/adr/ADR-002-dados.md):
// timestamps em `integer` (ms, modo "timestamp_ms"), booleanos em `integer` (modo "boolean"),
// IDs em `text` (UUID gerado na aplicação, nunca AUTOINCREMENT), nenhum SQL de dialeto fora de
// um ponto central (esta camada). Enumerações são `text` com `{ enum: [...] }` — checagem só em
// TypeScript; o único CHECK de banco é a regra de negócio explícita abaixo (encerrado ⇒ placar).

export const matches = sqliteTable(
  "matches",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    competition: text("competition").notNull(),
    round: text("round"),
    opponentName: text("opponent_name").notNull(),
    homeAway: text("home_away", { enum: ["casa", "fora", "neutro"] }).notNull(),
    // Nulo enquanto `kickoffPrecision` for "indefinido".
    kickoffAt: integer("kickoff_at", { mode: "timestamp_ms" }),
    kickoffPrecision: text("kickoff_precision", {
      enum: ["confirmado", "indefinido"],
    }).notNull(),
    venue: text("venue"),
    status: text("status", {
      enum: ["agendado", "adiado", "indefinido", "encerrado", "cancelado"],
    }).notNull(),
    scoreVasco: integer("score_vasco"),
    scoreOpponent: integer("score_opponent"),
    sourceName: text("source_name"),
    sourceUrl: text("source_url"),
    notes: text("notes"),
    updatedBy: text("updated_by"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("matches_kickoff_at_idx").on(table.kickoffAt),
    index("matches_status_kickoff_at_idx").on(table.status, table.kickoffAt),
    check(
      "matches_encerrado_tem_placar",
      sql`${table.status} != 'encerrado' OR (${table.scoreVasco} IS NOT NULL AND ${table.scoreOpponent} IS NOT NULL)`,
    ),
  ],
);

export const curatedLinks = sqliteTable(
  "curated_links",
  {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    urlNormalized: text("url_normalized").notNull().unique(),
    title: text("title").notNull(),
    sourceName: text("source_name").notNull(),
    label: text("label", {
      enum: ["noticia", "opiniao", "rumor", "video", "podcast"],
    }).notNull(),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    slot: text("slot", { enum: ["em1minuto", "ultimas"] }).notNull(),
    position: integer("position").notNull(),
    status: text("status", { enum: ["publicado", "retirado"] }).notNull(),
    curatedBy: text("curated_by").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    index("curated_links_status_slot_position_idx").on(
      table.status,
      table.slot,
      table.position,
    ),
    index("curated_links_status_created_at_idx").on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const leads = sqliteTable(
  "leads",
  {
    id: text("id").primaryKey(),
    channel: text("channel", { enum: ["email", "whatsapp"] }).notNull(),
    value: text("value").notNull(),
    valueNormalized: text("value_normalized").notNull().unique(),
    sourcePage: text("source_page").notNull(),
    privacyVersion: text("privacy_version").notNull(),
    consentedAt: integer("consented_at", { mode: "timestamp_ms" }).notNull(),
    ipHash: text("ip_hash").notNull(),
    exportedAt: integer("exported_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
  },
  (table) => [index("leads_created_at_idx").on(table.createdAt)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  valueJson: text("value_json").notNull(),
  updatedBy: text("updated_by"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const auditLog = sqliteTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    // Nulo quando a ação foi automática (sem ator humano).
    actorId: text("actor_id"),
    actorRole: text("actor_role").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason"),
    beforeJson: text("before_json"),
    afterJson: text("after_json"),
    ipHash: text("ip_hash"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("audit_log_target_created_at_idx").on(
      table.targetType,
      table.targetId,
      table.createdAt,
    ),
    index("audit_log_created_at_idx").on(table.createdAt),
  ],
);
