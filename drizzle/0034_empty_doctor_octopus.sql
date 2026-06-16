CREATE TABLE `cashier_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transactionType` enum('ticket','shipment','service','other') NOT NULL,
	`referenceId` int,
	`referenceType` varchar(50),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'XOF',
	`paymentMethod` enum('cash','card','mobile_money','check','transfer') NOT NULL,
	`status` enum('pending','completed','cancelled') NOT NULL DEFAULT 'pending',
	`cashierId` int,
	`companyId` int,
	`stationId` int,
	`receiptNumber` varchar(50),
	`ticketGenerated` boolean DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cashier_transactions_id` PRIMARY KEY(`id`)
);
