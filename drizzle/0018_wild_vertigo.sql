CREATE TABLE `chatbot_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`role` enum('user','assistant','csn') NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chatbot_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `chatbot_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionToken` varchar(64) NOT NULL,
	`visitorName` varchar(100) NOT NULL DEFAULT 'Visiteur',
	`visitorEmail` varchar(320),
	`status` enum('open','pending_csn','closed') NOT NULL DEFAULT 'open',
	`csnTookOver` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `chatbot_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `chatbot_sessions_sessionToken_unique` UNIQUE(`sessionToken`)
);
--> statement-breakpoint
CREATE TABLE `commercial_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`email` varchar(320) NOT NULL,
	`country` varchar(100) NOT NULL,
	`city` varchar(100) NOT NULL,
	`educationLevel` enum('brevet','bac','bac+2','bac+3','bac+4','bac+5','doctorat','autre') NOT NULL,
	`language` enum('francais','espagnol','anglais') NOT NULL,
	`status` enum('nouveau','contacte','entretien','retenu','rejete') NOT NULL DEFAULT 'nouveau',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `commercial_candidates_id` PRIMARY KEY(`id`)
);
