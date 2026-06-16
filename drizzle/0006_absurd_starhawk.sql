CREATE TABLE `special_offers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelProfileId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`discountType` enum('percent','fixed') NOT NULL DEFAULT 'percent',
	`discountValue` decimal(10,2) NOT NULL,
	`minNights` int DEFAULT 1,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`badgeLabel` varchar(50),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `special_offers_id` PRIMARY KEY(`id`)
);
