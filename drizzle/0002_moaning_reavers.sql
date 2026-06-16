ALTER TABLE `clients` ADD `notes` text;--> statement-breakpoint
ALTER TABLE `clients` ADD `clientType` enum('standard','vip','corporate','groupe') DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE `clients` ADD `company` varchar(200);