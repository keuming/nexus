CREATE TABLE `routes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`departureCity` varchar(100) NOT NULL,
	`arrivalCity` varchar(100) NOT NULL,
	`distance` int,
	`estimatedDuration` int,
	`basePrice` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'XOF',
	`isActive` boolean NOT NULL DEFAULT true,
	`description` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `routes_id` PRIMARY KEY(`id`)
);
