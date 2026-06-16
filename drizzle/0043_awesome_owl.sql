CREATE TABLE `furnished_residences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`address` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`country` varchar(100) NOT NULL,
	`phone` varchar(50),
	`email` varchar(320),
	`totalRooms` int NOT NULL DEFAULT 1,
	`amenities` text,
	`pricePerNight` decimal(10,2) NOT NULL,
	`pricePerMonth` decimal(10,2),
	`minStay` int DEFAULT 1,
	`maxStay` int,
	`status` enum('active','inactive','maintenance') NOT NULL DEFAULT 'active',
	`images` text,
	`rating` decimal(3,2) DEFAULT '0.00',
	`reviewCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `furnished_residences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `guest_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reservationId` int NOT NULL,
	`residenceId` int NOT NULL,
	`guestName` varchar(255) NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`cleanliness` int,
	`comfort` int,
	`amenities` int,
	`service` int,
	`verified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `guest_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `residence_reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`residenceId` int NOT NULL,
	`guestName` varchar(255) NOT NULL,
	`guestEmail` varchar(320) NOT NULL,
	`guestPhone` varchar(50),
	`checkInDate` date NOT NULL,
	`checkOutDate` date NOT NULL,
	`numberOfRooms` int NOT NULL DEFAULT 1,
	`numberOfGuests` int NOT NULL DEFAULT 1,
	`totalPrice` decimal(10,2) NOT NULL,
	`paidAmount` decimal(10,2) DEFAULT '0.00',
	`paymentStatus` enum('pending','partial','paid') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`reservationStatus` enum('pending','confirmed','checked_in','checked_out','cancelled') NOT NULL DEFAULT 'pending',
	`specialRequests` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `residence_reservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `room_availability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`residenceId` int NOT NULL,
	`date` date NOT NULL,
	`availableRooms` int NOT NULL,
	`pricePerNight` decimal(10,2),
	`status` enum('available','booked','blocked') NOT NULL DEFAULT 'available',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `room_availability_id` PRIMARY KEY(`id`)
);
