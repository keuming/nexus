CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`hotelProfileId` int NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320),
	`rating` int NOT NULL,
	`comment` text,
	`approved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
