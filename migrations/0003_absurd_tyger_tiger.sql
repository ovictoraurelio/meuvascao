CREATE TABLE `comments` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`author_id` text NOT NULL,
	`parent_id` text,
	`body` text NOT NULL,
	`status` text DEFAULT 'visible' NOT NULL,
	`like_count` integer DEFAULT 0 NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `comments_author_key_idx` ON `comments` (`author_id`,`idempotency_key`);--> statement-breakpoint
CREATE INDEX `comments_thread_cursor_idx` ON `comments` (`thread_id`,`created_at`,`id`);--> statement-breakpoint
CREATE INDEX `comments_author_created_idx` ON `comments` (`author_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `reactions` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reactions_comment_user_idx` ON `reactions` (`comment_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`comment_id` text NOT NULL,
	`reporter_id` text NOT NULL,
	`reason` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	`resolved_by` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reports_comment_reporter_idx` ON `reports` (`comment_id`,`reporter_id`);--> statement-breakpoint
CREATE INDEX `reports_status_created_idx` ON `reports` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `threads` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`slow_mode_seconds` integer DEFAULT 0 NOT NULL,
	`comment_count` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `threads_match_id_unique` ON `threads` (`match_id`);