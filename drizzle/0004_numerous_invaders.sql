CREATE TABLE `cities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`countryId` int NOT NULL,
	CONSTRAINT `cities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`flag` varchar(10),
	CONSTRAINT `countries_id` PRIMARY KEY(`id`),
	CONSTRAINT `countries_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `hotel_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`hotelName` varchar(255) NOT NULL,
	`managerName` varchar(255),
	`phone` varchar(50),
	`email` varchar(320),
	`address` text,
	`countryId` int,
	`cityId` int,
	`type` enum('hotel','restaurant') NOT NULL DEFAULT 'hotel',
	`stars` int DEFAULT 3,
	`logoUrl` text,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hotel_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `hotel_profiles_userId_unique` UNIQUE(`userId`)
);
