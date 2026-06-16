ALTER TABLE `credit_requests` ADD `cinetpayTransactionId` varchar(100);--> statement-breakpoint
ALTER TABLE `credit_requests` ADD `cinetpayPaymentUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `credit_requests` ADD `cinetpayPaymentToken` varchar(200);