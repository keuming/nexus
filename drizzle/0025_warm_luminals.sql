ALTER TABLE `chatbot_sessions` ADD `humanTakeoverActive` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `chatbot_sessions` ADD `humanTakeoverAt` timestamp;