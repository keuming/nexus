CREATE TABLE `transport_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`tripId` int NOT NULL,
	`bookingRef` varchar(20) NOT NULL,
	`seatNumber` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(50),
	`email` varchar(320),
	`priceXOF` decimal(12,2),
	`status` enum('en_attente','confirme','annule') NOT NULL DEFAULT 'en_attente',
	`cashStatus` enum('en_attente','encaisse') NOT NULL DEFAULT 'en_attente',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transport_bookings_id` PRIMARY KEY(`id`),
	CONSTRAINT `transport_bookings_bookingRef_unique` UNIQUE(`bookingRef`)
);
--> statement-breakpoint
CREATE TABLE `transport_bus_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`departureCity` varchar(100) NOT NULL,
	`arrivalCity` varchar(100) NOT NULL,
	`departureCountryId` int,
	`arrivalCountryId` int,
	`lineType` enum('national','international') NOT NULL DEFAULT 'national',
	`distance` int,
	`estimatedDuration` int,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transport_bus_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transport_buses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`registration` varchar(50) NOT NULL,
	`model` varchar(100),
	`capacity` int NOT NULL DEFAULT 50,
	`status` enum('disponible','en_service','maintenance') NOT NULL DEFAULT 'disponible',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transport_buses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transport_cashier_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` int NOT NULL,
	`pinHash` varchar(255),
	`station` varchar(100),
	`pinAttempts` int NOT NULL DEFAULT 0,
	`pinLockedUntil` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transport_cashier_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `transport_cashier_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `transport_charges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`category` enum('carburant','maintenance','salaire','frais_divers') NOT NULL,
	`description` text,
	`amount` decimal(12,2) NOT NULL,
	`station` varchar(100),
	`chargeDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transport_charges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transport_companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`managerName` varchar(255),
	`phone` varchar(50),
	`email` varchar(320),
	`address` text,
	`countryId` int,
	`cityId` int,
	`logoUrl` text,
	`description` text,
	`printHeaderText` text,
	`printFooterText` text,
	`primaryColor` varchar(20) DEFAULT '#1a56db',
	`status` enum('pending','active','suspended','rejected') NOT NULL DEFAULT 'pending',
	`validatedAt` timestamp,
	`validatedBy` int,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transport_companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `transport_companies_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `transport_company_billing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`billingPeriod` varchar(10) NOT NULL,
	`ticketsSold` int NOT NULL DEFAULT 0,
	`ticketsCashed` int NOT NULL DEFAULT 0,
	`shipmentsCashed` int NOT NULL DEFAULT 0,
	`ticketFeeXOF` decimal(12,2) DEFAULT '0',
	`shipmentFeeXOF` decimal(12,2) DEFAULT '0',
	`totalFeeXOF` decimal(12,2) DEFAULT '0',
	`status` enum('en_attente','facture','paye') NOT NULL DEFAULT 'en_attente',
	`generatedAt` timestamp NOT NULL DEFAULT (now()),
	`paidAt` timestamp,
	CONSTRAINT `transport_company_billing_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transport_departures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`busLineId` int NOT NULL,
	`busId` int,
	`tripId` int,
	`departureDate` date NOT NULL,
	`departureTime` varchar(10) NOT NULL,
	`driverName` varchar(255),
	`status` enum('programme','embarquement','en_route','arrive','annule') NOT NULL DEFAULT 'programme',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transport_departures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transport_route_fares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`busLineId` int NOT NULL,
	`fromCity` varchar(100) NOT NULL,
	`toCity` varchar(100) NOT NULL,
	`priceXOF` decimal(12,2),
	`priceGHS` decimal(12,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transport_route_fares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transport_shipments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`trackingNumber` varchar(30) NOT NULL,
	`senderName` varchar(255) NOT NULL,
	`senderPhone` varchar(50),
	`senderCity` varchar(100),
	`receiverName` varchar(255) NOT NULL,
	`receiverPhone` varchar(50),
	`receiverCity` varchar(100),
	`description` text,
	`weight` decimal(8,2),
	`priceXOF` decimal(12,2),
	`photoUrl` text,
	`photoKey` varchar(512),
	`status` enum('enregistre','en_transit','arrive','livre') NOT NULL DEFAULT 'enregistre',
	`cashStatus` enum('en_attente','encaisse') NOT NULL DEFAULT 'en_attente',
	`registeredBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transport_shipments_id` PRIMARY KEY(`id`),
	CONSTRAINT `transport_shipments_trackingNumber_unique` UNIQUE(`trackingNumber`)
);
--> statement-breakpoint
CREATE TABLE `transport_staff` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`userId` int,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(50),
	`role` enum('chauffeur','agent_billetterie','agent_expedition','caissier','superviseur','directeur') NOT NULL,
	`station` varchar(100),
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transport_staff_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transport_stations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`city` varchar(100) NOT NULL,
	`countryId` int,
	`address` text,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transport_stations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transport_tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`ticketNumber` varchar(30) NOT NULL,
	`departureId` int NOT NULL,
	`seatNumber` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(50),
	`idType` enum('cni','passeport','carte_consulaire','carte_resident','laissez_passer') DEFAULT 'cni',
	`idNumber` varchar(100),
	`gender` enum('M','F') DEFAULT 'M',
	`nationality` varchar(100),
	`dropOffCity` varchar(100),
	`priceXOF` decimal(12,2),
	`paymentMethod` enum('cash','mobile_money','virement') DEFAULT 'cash',
	`ticketStatus` enum('actif','utilise','annule') NOT NULL DEFAULT 'actif',
	`cashStatus` enum('en_attente','encaisse') NOT NULL DEFAULT 'en_attente',
	`boardingStatus` enum('non_embarque','embarque') NOT NULL DEFAULT 'non_embarque',
	`qrCode` text,
	`soldBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transport_tickets_id` PRIMARY KEY(`id`),
	CONSTRAINT `transport_tickets_ticketNumber_unique` UNIQUE(`ticketNumber`)
);
--> statement-breakpoint
CREATE TABLE `transport_trips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`busLineId` int NOT NULL,
	`departureDate` date NOT NULL,
	`departureTime` varchar(10) NOT NULL,
	`priceXOF` decimal(12,2),
	`priceGHS` decimal(12,2),
	`totalSeats` int NOT NULL DEFAULT 50,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `transport_trips_id` PRIMARY KEY(`id`)
);
