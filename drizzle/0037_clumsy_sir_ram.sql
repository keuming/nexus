ALTER TABLE `commercial_candidates` ADD `cvUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `commercial_candidates` ADD `cvKey` varchar(500);--> statement-breakpoint
ALTER TABLE `commercial_candidates` ADD `coverLetterUrl` varchar(1000);--> statement-breakpoint
ALTER TABLE `commercial_candidates` ADD `coverLetterKey` varchar(500);--> statement-breakpoint
ALTER TABLE `commercial_candidates` ADD `experience` enum('aucune','moins_1an','1_3ans','3_5ans','plus_5ans');--> statement-breakpoint
ALTER TABLE `commercial_candidates` ADD `targetSector` enum('transport','restauration','hotel','boutique','agence_voyage','tous');--> statement-breakpoint
ALTER TABLE `commercial_candidates` ADD `motivation` text;