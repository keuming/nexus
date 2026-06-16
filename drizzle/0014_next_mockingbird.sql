CREATE TABLE `company_gallery` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`imageUrl` varchar(500) NOT NULL,
	`caption` varchar(200),
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_gallery_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `company_reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`authorName` varchar(150) NOT NULL,
	`rating` int NOT NULL,
	`comment` text,
	`activityType` varchar(30) NOT NULL DEFAULT 'transport',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_reviews_id` PRIMARY KEY(`id`)
);
