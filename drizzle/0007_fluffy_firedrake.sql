CREATE TABLE `room_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`url` text NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`caption` varchar(255),
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `room_photos_id` PRIMARY KEY(`id`)
);
