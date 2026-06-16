CREATE TABLE `shop_product_order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(12,2) NOT NULL,
	`subtotal` decimal(12,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_product_order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_product_orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reference` varchar(50) NOT NULL,
	`supplierId` int NOT NULL,
	`clientName` varchar(200) NOT NULL,
	`clientPhone` varchar(50) NOT NULL,
	`clientEmail` varchar(320),
	`deliveryAddress` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`totalAmountXOF` decimal(12,2) NOT NULL,
	`status` enum('pending','confirmed','in_delivery','delivered','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` enum('cash','mobile_money','card','bank_transfer') DEFAULT 'cash',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_product_orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `shop_product_orders_reference_unique` UNIQUE(`reference`)
);
--> statement-breakpoint
CREATE TABLE `shop_product_stock_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`supplierId` int NOT NULL,
	`movementType` enum('in','out','adjustment','return') NOT NULL,
	`quantity` int NOT NULL,
	`reason` varchar(255),
	`reference` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shop_product_stock_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shop_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`supplierId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`price` decimal(12,2) NOT NULL,
	`stock` int NOT NULL DEFAULT 0,
	`sku` varchar(100),
	`barcode` varchar(100),
	`imageUrl` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`minStockAlert` int DEFAULT 10,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shop_products_id` PRIMARY KEY(`id`),
	CONSTRAINT `shop_products_sku_unique` UNIQUE(`sku`)
);
