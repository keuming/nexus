CREATE TABLE `company_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyId` int NOT NULL,
	`url` varchar(500) NOT NULL,
	`fileKey` varchar(300) NOT NULL,
	`caption` varchar(300) DEFAULT '',
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `company_photos_id` PRIMARY KEY(`id`)
);
