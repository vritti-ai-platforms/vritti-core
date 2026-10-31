DROP TYPE "commerce"."field_type";
--> statement-breakpoint
ALTER TYPE "commerce"."inventory_tracking" RENAME VALUE 'quantity' TO 'QUANTITY';
--> statement-breakpoint
ALTER TYPE "commerce"."inventory_tracking" RENAME VALUE 'lot' TO 'LOT';
--> statement-breakpoint
ALTER TYPE "commerce"."inventory_tracking" RENAME VALUE 'lot_serial' TO 'LOT_SERIAL';
--> statement-breakpoint
ALTER TYPE "commerce"."inventory_tracking" RENAME VALUE 'serial' TO 'SERIAL';
--> statement-breakpoint
ALTER TYPE "commerce"."inventory_pick_strategy" RENAME VALUE 'none' TO 'NONE';
--> statement-breakpoint
ALTER TYPE "commerce"."inventory_pick_strategy" RENAME VALUE 'fifo' TO 'FIFO';
--> statement-breakpoint
ALTER TYPE "commerce"."inventory_pick_strategy" RENAME VALUE 'fefo' TO 'FEFO';
--> statement-breakpoint
ALTER TYPE "commerce"."cost_source_type" RENAME VALUE 'goods_receipt' TO 'GOODS_RECEIPT';
--> statement-breakpoint
ALTER TYPE "commerce"."cost_source_type" RENAME VALUE 'stock_adjustment' TO 'STOCK_ADJUSTMENT';
--> statement-breakpoint
ALTER TYPE "commerce"."cost_source_type" RENAME VALUE 'stock_transfer' TO 'STOCK_TRANSFER';
--> statement-breakpoint
ALTER TYPE "commerce"."cost_source_type" RENAME VALUE 'manual_adjustment' TO 'MANUAL_ADJUSTMENT';
--> statement-breakpoint
ALTER TYPE "commerce"."cost_distribution_method" RENAME VALUE 'by_value' TO 'BY_VALUE';
--> statement-breakpoint
ALTER TYPE "commerce"."cost_distribution_method" RENAME VALUE 'by_quantity' TO 'BY_QUANTITY';
--> statement-breakpoint
ALTER TYPE "commerce"."cost_distribution_method" RENAME VALUE 'equal' TO 'EQUAL';
