CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text,
	`actor_role` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text,
	`before_json` text,
	`after_json` text,
	`ip_hash` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_log_target_created_at_idx` ON `audit_log` (`target_type`,`target_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `audit_log_created_at_idx` ON `audit_log` (`created_at`);--> statement-breakpoint
CREATE TABLE `curated_links` (
	`id` text PRIMARY KEY NOT NULL,
	`url` text NOT NULL,
	`url_normalized` text NOT NULL,
	`title` text NOT NULL,
	`source_name` text NOT NULL,
	`label` text NOT NULL,
	`published_at` integer,
	`slot` text NOT NULL,
	`position` integer NOT NULL,
	`status` text NOT NULL,
	`curated_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `curated_links_url_normalized_unique` ON `curated_links` (`url_normalized`);--> statement-breakpoint
CREATE INDEX `curated_links_status_slot_position_idx` ON `curated_links` (`status`,`slot`,`position`);--> statement-breakpoint
CREATE INDEX `curated_links_status_created_at_idx` ON `curated_links` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `leads` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`value` text NOT NULL,
	`value_normalized` text NOT NULL,
	`source_page` text NOT NULL,
	`privacy_version` text NOT NULL,
	`consented_at` integer NOT NULL,
	`ip_hash` text NOT NULL,
	`exported_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leads_value_normalized_unique` ON `leads` (`value_normalized`);--> statement-breakpoint
CREATE INDEX `leads_created_at_idx` ON `leads` (`created_at`);--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`competition` text NOT NULL,
	`round` text,
	`opponent_name` text NOT NULL,
	`home_away` text NOT NULL,
	`kickoff_at` integer,
	`kickoff_precision` text NOT NULL,
	`venue` text,
	`status` text NOT NULL,
	`score_vasco` integer,
	`score_opponent` integer,
	`source_name` text,
	`source_url` text,
	`notes` text,
	`updated_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	CONSTRAINT "matches_encerrado_tem_placar" CHECK("matches"."status" != 'encerrado' OR ("matches"."score_vasco" IS NOT NULL AND "matches"."score_opponent" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `matches_slug_unique` ON `matches` (`slug`);--> statement-breakpoint
CREATE INDEX `matches_kickoff_at_idx` ON `matches` (`kickoff_at`);--> statement-breakpoint
CREATE INDEX `matches_status_kickoff_at_idx` ON `matches` (`status`,`kickoff_at`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value_json` text NOT NULL,
	`updated_by` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
