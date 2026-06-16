CREATE TABLE `delivery_zones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`extraMinutes` int NOT NULL DEFAULT 15,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `delivery_zones_id` PRIMARY KEY(`id`)
);
