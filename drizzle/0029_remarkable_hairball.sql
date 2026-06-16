CREATE TABLE `client_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`bookingType` enum('transport','restaurant','expedition') NOT NULL,
	`bookingRef` varchar(100) NOT NULL,
	`status` enum('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
	`departureDate` date,
	`departureCity` varchar(100),
	`arrivalCity` varchar(100),
	`companyId` int,
	`companyName` varchar(150),
	`totalPrice` decimal(10,2),
	`currency` varchar(10) NOT NULL DEFAULT 'XOF',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_bookings_bookingRef_unique` UNIQUE(`bookingRef`)
);
--> statement-breakpoint
ALTER TABLE `client_bookings` ADD CONSTRAINT `client_bookings_clientId_clients_id_fk` FOREIGN KEY (`clientId`) REFERENCES `clients`(`id`) ON DELETE cascade ON UPDATE no action;