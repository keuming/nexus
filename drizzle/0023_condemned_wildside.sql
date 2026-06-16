ALTER TABLE `credit_transactions` ADD `balanceBefore` int;--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD `reference` varchar(100);--> statement-breakpoint
ALTER TABLE `credit_transactions` ADD `adminNote` varchar(300);