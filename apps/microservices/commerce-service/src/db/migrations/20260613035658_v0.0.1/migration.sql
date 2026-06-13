ALTER TABLE "vritti_core"."inventory_item_lots" ADD COLUMN "mrp" bigint;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD COLUMN "mrp_uom_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" DROP COLUMN "mrp";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quants" DROP COLUMN "mrp";--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" DROP COLUMN "mrp";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD CONSTRAINT "inventory_items_mrp_uom_id_uom_id_fkey" FOREIGN KEY ("mrp_uom_id") REFERENCES "vritti_core"."uom"("id");