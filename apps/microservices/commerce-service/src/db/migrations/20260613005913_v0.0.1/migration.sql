ALTER TABLE "vritti_core"."goods_receipt_items" ADD COLUMN "mrp" bigint;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lots" ADD COLUMN "mrp" bigint;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_quants" ADD COLUMN "mrp" bigint;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_items" ADD COLUMN "default_mrp" bigint;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lots" ADD COLUMN "mrp" bigint;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" ADD COLUMN "mrp" bigint;