ALTER TABLE `payments` ADD `type` enum('encaissement','decaissement') DEFAULT 'encaissement';--> statement-breakpoint
ALTER TABLE `payments` ADD `description` text;