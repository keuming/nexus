ALTER TABLE `clients` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `clients` ADD `isActive` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `clients` ADD `lastLoginAt` timestamp;--> statement-breakpoint
ALTER TABLE `clients` ADD `country` varchar(100);--> statement-breakpoint
ALTER TABLE `clients` ADD `city` varchar(100);--> statement-breakpoint
ALTER TABLE `clients` ADD CONSTRAINT `clients_email_unique` UNIQUE(`email`);