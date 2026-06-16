CREATE TABLE `buses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`licensePlate` varchar(50) NOT NULL,
	`model` varchar(100) NOT NULL,
	`capacity` int NOT NULL,
	`companyId` int,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buses_id` PRIMARY KEY(`id`),
	CONSTRAINT `buses_licensePlate_unique` UNIQUE(`licensePlate`)
);
--> statement-breakpoint
CREATE TABLE `stops` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`city` varchar(100) NOT NULL,
	`address` text,
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `stops_id` PRIMARY KEY(`id`)
);
