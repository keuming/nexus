CREATE TABLE `online_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`orderRef` varchar(30) NOT NULL,
	`customerName` varchar(150) NOT NULL,
	`customerPhone` varchar(30) NOT NULL,
	`deliveryType` varchar(20) NOT NULL DEFAULT 'sur_place',
	`deliveryAddress` varchar(300),
	`notes` text,
	`itemsJson` text NOT NULL,
	`totalXOF` decimal(12,2) NOT NULL,
	`estimatedPrepTime` int,
	`status` varchar(30) NOT NULL DEFAULT 'nouvelle',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `online_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `online_orders_orderRef_unique` UNIQUE(`orderRef`)
);
