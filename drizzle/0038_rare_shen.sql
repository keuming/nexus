CREATE TABLE `business_developers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bdId` varchar(7) NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`contact` varchar(100),
	`email` varchar(320) NOT NULL,
	`whatsapp` varchar(30),
	`loginPhone` varchar(30) NOT NULL,
	`countryCode` varchar(5) NOT NULL DEFAULT '+225',
	`pinHash` varchar(255) NOT NULL,
	`status` enum('active','suspended','pending') NOT NULL DEFAULT 'pending',
	`lastLoginAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `business_developers_id` PRIMARY KEY(`id`),
	CONSTRAINT `business_developers_bdId_unique` UNIQUE(`bdId`),
	CONSTRAINT `business_developers_email_unique` UNIQUE(`email`),
	CONSTRAINT `business_developers_loginPhone_unique` UNIQUE(`loginPhone`)
);
--> statement-breakpoint
ALTER TABLE `transport_companies` ADD `bdId` varchar(7);