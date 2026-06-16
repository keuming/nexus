CREATE TABLE `company_credits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`countryCode` varchar(10) NOT NULL DEFAULT 'CI',
	`currency` varchar(10) NOT NULL DEFAULT 'XOF',
	`pointPriceLocal` decimal(10,2) NOT NULL DEFAULT '125.00',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `company_credits_id` PRIMARY KEY(`id`),
	CONSTRAINT `company_credits_companyId_unique` UNIQUE(`companyId`)
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`type` varchar(20) NOT NULL,
	`points` int NOT NULL,
	`amountLocal` decimal(12,2),
	`description` varchar(300) NOT NULL,
	`refType` varchar(50),
	`refId` varchar(100),
	`balanceAfter` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
