CREATE TABLE `admin_login_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`email` varchar(320) NOT NULL,
	`displayName` varchar(100),
	`ipAddress` varchar(64),
	`userAgent` varchar(512),
	`success` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `admin_login_logs_id` PRIMARY KEY(`id`)
);
