ALTER TABLE `gas_orders` ADD `deliverymanId` int;--> statement-breakpoint
ALTER TABLE `gas_orders` ADD `selectedSupplierId` int;--> statement-breakpoint
ALTER TABLE `gas_orders` ADD `status` enum('pending','assigned_to_deliveryman','validated_by_deliveryman','delivered','cancelled') DEFAULT 'pending';