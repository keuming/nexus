ALTER TABLE `users` ADD `confirmPinHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `confirmPinAttempts` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `confirmPinLockedUntil` timestamp;