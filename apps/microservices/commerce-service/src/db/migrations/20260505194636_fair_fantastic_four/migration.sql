ALTER TABLE "vritti_core"."inventory_items" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "vritti_core"."inventory_item_type";--> statement-breakpoint
CREATE TYPE "vritti_core"."inventory_item_type" AS ENUM('RAW_MATERIAL', 'SEMI_FINISHED', 'FINISHED_GOOD', 'PACKAGING', 'CONSUMABLE');--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ALTER COLUMN "type" SET DATA TYPE "vritti_core"."inventory_item_type" USING "type"::"vritti_core"."inventory_item_type";