CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`nationality` varchar(100),
	`idType` enum('passeport','cni','permis','autre'),
	`idNumber` varchar(100),
	`address` text,
	`preferences` text,
	`vip` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(50),
	`role` enum('admin','manager','receptionniste','housekeeping','restauration','maintenance') NOT NULL,
	`department` varchar(100),
	`hireDate` date,
	`salary` decimal(12,2),
	`status` enum('actif','conge','inactif') DEFAULT 'actif',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hotel_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL DEFAULT 'Mon Hôtel',
	`stars` int DEFAULT 3,
	`address` text,
	`phone` varchar(50),
	`email` varchar(320),
	`currency` varchar(10) DEFAULT 'FCFA',
	`checkInTime` varchar(10) DEFAULT '14:00',
	`checkOutTime` varchar(10) DEFAULT '12:00',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hotel_settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `housekeeping_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`assignedTo` int,
	`type` enum('nettoyage','recouche','depart','inspection','maintenance') DEFAULT 'nettoyage',
	`status` enum('en_attente','en_cours','termine','verifie') DEFAULT 'en_attente',
	`priority` enum('basse','normale','haute','urgente') DEFAULT 'normale',
	`scheduledAt` timestamp,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `housekeeping_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	CONSTRAINT `inventory_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`categoryId` int,
	`unit` varchar(50) DEFAULT 'unité',
	`currentStock` decimal(10,2) DEFAULT '0',
	`minStock` decimal(10,2) DEFAULT '0',
	`maxStock` decimal(10,2),
	`unitCost` decimal(12,2) DEFAULT '0',
	`supplier` varchar(200),
	`location` varchar(100),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventory_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`type` enum('entree','sortie','ajustement') NOT NULL,
	`quantity` decimal(10,2) NOT NULL,
	`reason` varchar(255),
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(30) NOT NULL,
	`reservationId` int,
	`clientId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`taxAmount` decimal(12,2) DEFAULT '0',
	`totalAmount` decimal(12,2) NOT NULL,
	`status` enum('brouillon','emise','payee','annulee') DEFAULT 'brouillon',
	`issuedAt` timestamp NOT NULL DEFAULT (now()),
	`dueAt` timestamp,
	`notes` text,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reservationId` int,
	`invoiceId` int,
	`clientId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`method` enum('especes','carte','virement','mobile_money','cheque') DEFAULT 'especes',
	`reference` varchar(100),
	`status` enum('en_attente','complete','rembourse','echec') DEFAULT 'complete',
	`paidAt` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	`createdBy` int,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservation_services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reservationId` int NOT NULL,
	`serviceId` int NOT NULL,
	`quantity` int DEFAULT 1,
	`unitPrice` decimal(12,2) NOT NULL,
	`totalPrice` decimal(12,2) NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`notes` text,
	CONSTRAINT `reservation_services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(20) NOT NULL,
	`clientId` int NOT NULL,
	`roomId` int NOT NULL,
	`checkInDate` date NOT NULL,
	`checkOutDate` date NOT NULL,
	`actualCheckIn` timestamp,
	`actualCheckOut` timestamp,
	`adults` int DEFAULT 1,
	`children` int DEFAULT 0,
	`status` enum('en_attente','confirmee','checkin','checkout','annulee','no_show') NOT NULL DEFAULT 'en_attente',
	`totalAmount` decimal(12,2) DEFAULT '0',
	`paidAmount` decimal(12,2) DEFAULT '0',
	`source` enum('direct','booking','expedia','airbnb','phone','walk_in') DEFAULT 'direct',
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`),
	CONSTRAINT `reservations_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `room_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`basePrice` decimal(12,2) NOT NULL DEFAULT '0',
	`capacity` int DEFAULT 2,
	`amenities` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `room_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`number` varchar(20) NOT NULL,
	`floor` int DEFAULT 1,
	`roomTypeId` int NOT NULL,
	`status` enum('libre','occupee','maintenance','reservee','nettoyage') NOT NULL DEFAULT 'libre',
	`priceOverride` decimal(12,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`),
	CONSTRAINT `rooms_number_unique` UNIQUE(`number`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(150) NOT NULL,
	`category` enum('restaurant','spa','blanchisserie','transport','minibar','autre') DEFAULT 'autre',
	`price` decimal(12,2) NOT NULL DEFAULT '0',
	`unit` varchar(50) DEFAULT 'unité',
	`description` text,
	`active` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
