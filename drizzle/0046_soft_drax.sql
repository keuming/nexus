CREATE TABLE `transport_gallery_images` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`fileKey` varchar(255) NOT NULL,
	`caption` varchar(255),
	`sortOrder` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transport_gallery_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `transport_companies` ADD `galleryImageUrl` text;