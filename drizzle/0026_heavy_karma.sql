ALTER TABLE `chatbot_sessions` ADD `adminInterventionActive` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `chatbot_sessions` ADD `adminId` int;--> statement-breakpoint
ALTER TABLE `chatbot_sessions` ADD `adminInterventionAt` timestamp;--> statement-breakpoint
ALTER TABLE `chatbot_sessions` ADD `adminInterventionReason` text;