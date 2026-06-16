CREATE TABLE `gas_bottles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`capacity` varchar(50) NOT NULL,
	`priceXOF` decimal(12,2) NOT NULL,
	`deliveryFeeXOF` decimal(12,2) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`minStock` int NOT NULL DEFAULT 5,
	`description` text,
	`isAvailable` boolean NOT NULL DEFAULT true,
	`photoUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gas_bottles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gas_deliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`driverId` int,
	`driverName` varchar(200),
	`driverPhone` varchar(50),
	`vehicleInfo` varchar(200),
	`gpsLatitude` varchar(50),
	`gpsLongitude` varchar(50),
	`status` enum('pending','in_transit','arrived','completed','failed') DEFAULT 'pending',
	`startedAt` timestamp,
	`completedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gas_deliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gas_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`bottleId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPriceXOF` decimal(12,2) NOT NULL,
	`deliveryFeeXOF` decimal(12,2) NOT NULL,
	`subtotalXOF` decimal(12,2) NOT NULL,
	CONSTRAINT `gas_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gas_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(50) NOT NULL,
	`clientName` varchar(200) NOT NULL,
	`clientPhone` varchar(50) NOT NULL,
	`clientEmail` varchar(320),
	`deliveryAddress` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`supplierId` int NOT NULL,
	`totalAmountXOF` decimal(12,2) NOT NULL,
	`paymentMethod` enum('cash','mobile_money','card','bank_transfer') DEFAULT 'cash',
	`paymentStatus` enum('pending','partial','paid') DEFAULT 'pending',
	`orderStatus` enum('pending','confirmed','in_delivery','delivered','cancelled') DEFAULT 'pending',
	`deliveryDate` timestamp,
	`estimatedDeliveryTime` varchar(50),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gas_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `gas_orders_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `gas_suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`email` varchar(320),
	`address` text,
	`city` varchar(100),
	`country` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`logoUrl` text,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `gas_suppliers_id` PRIMARY KEY(`id`)
);
