CREATE TABLE `gas_deliverymen` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(20) NOT NULL,
	`email` varchar(255),
	`address` varchar(255),
	`city` varchar(100),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gas_deliverymen_id` PRIMARY KEY(`id`),
	CONSTRAINT `gas_deliverymen_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `gas_order_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`recipientType` enum('supplier','deliveryman') NOT NULL,
	`recipientId` int NOT NULL,
	`notificationType` enum('new_order','order_assigned','order_validated','order_delivered') NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gas_order_notifications_id` PRIMARY KEY(`id`)
);
