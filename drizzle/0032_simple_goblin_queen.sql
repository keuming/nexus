ALTER TABLE `clients` MODIFY COLUMN `firstName` varchar(100);--> statement-breakpoint
ALTER TABLE `clients` MODIFY COLUMN `lastName` varchar(100);--> statement-breakpoint
ALTER TABLE `clients` ADD `name` varchar(200) NOT NULL;