CREATE TABLE `auth_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`email_normalized` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`ip_hash` text,
	`ua_hash` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `auth_tokens_token_hash_unique` ON `auth_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `auth_tokens_email_created_at_idx` ON `auth_tokens` (`email_normalized`,`created_at`);--> statement-breakpoint
CREATE INDEX `auth_tokens_ip_created_at_idx` ON `auth_tokens` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `auth_tokens_expires_at_idx` ON `auth_tokens` (`expires_at`);--> statement-breakpoint
CREATE TABLE `dev_mailbox` (
	`id` text PRIMARY KEY NOT NULL,
	`to` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`link` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `sessions_user_revoked_idx` ON `sessions` (`user_id`,`revoked_at`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`email_normalized` text NOT NULL,
	`nickname` text,
	`nickname_normalized` text,
	`role` text DEFAULT 'torcedor' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`suspended_until` integer,
	`suspended_reason` text,
	`privacy_version_accepted` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_normalized_unique` ON `users` (`email_normalized`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_nickname_normalized_unique` ON `users` (`nickname_normalized`);--> statement-breakpoint
CREATE INDEX `users_status_idx` ON `users` (`status`);