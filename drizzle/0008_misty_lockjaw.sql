ALTER TABLE `reservations` ADD `refusalReason` text;--> statement-breakpoint
ALTER TABLE `reservations` ADD `confirmedAt` timestamp;--> statement-breakpoint
ALTER TABLE `reservations` ADD `refusedAt` timestamp;