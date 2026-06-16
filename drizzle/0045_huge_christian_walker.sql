CREATE TABLE `leisure_activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`location` varchar(255) NOT NULL,
	`pricePerPerson` varchar(50) NOT NULL,
	`maxCapacity` int NOT NULL,
	`duration` varchar(100),
	`image` text,
	`rating` decimal(3,2),
	`reviewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leisure_activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leisure_bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`guestName` varchar(255) NOT NULL,
	`guestEmail` varchar(255) NOT NULL,
	`guestPhone` varchar(20),
	`bookingDate` timestamp NOT NULL,
	`numberOfPeople` int NOT NULL,
	`totalPrice` varchar(50) NOT NULL,
	`paidAmount` decimal(10,2),
	`paymentStatus` enum('pending','partial','paid') DEFAULT 'pending',
	`bookingStatus` enum('pending','confirmed','cancelled','completed') DEFAULT 'pending',
	`specialRequests` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leisure_bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leisure_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityId` int NOT NULL,
	`guestName` varchar(255) NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leisure_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_inventory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`availableQuantity` int NOT NULL,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rental_inventory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rental_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`pricePerDay` varchar(50) NOT NULL,
	`pricePerWeek` varchar(50),
	`pricePerMonth` varchar(50),
	`depositAmount` varchar(50),
	`image` text,
	`rating` decimal(3,2),
	`reviewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rental_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` varchar(50) NOT NULL,
	`totalPrice` varchar(50) NOT NULL,
	CONSTRAINT `sales_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`customerName` varchar(255) NOT NULL,
	`customerEmail` varchar(255) NOT NULL,
	`customerPhone` varchar(20),
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`totalAmount` varchar(50) NOT NULL,
	`paymentStatus` enum('pending','partial','paid') DEFAULT 'pending',
	`orderStatus` enum('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
	`deliveryDate` timestamp,
	`deliveryAddress` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sales_orders_id` PRIMARY KEY(`id`)
);
