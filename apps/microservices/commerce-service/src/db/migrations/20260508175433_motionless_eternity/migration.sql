ALTER TABLE "vritti_core"."goods_receipt_lots" ALTER COLUMN "expiry_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_lots" ALTER COLUMN "expiry_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lots" ALTER COLUMN "expiry_date" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_lots" ADD CONSTRAINT "ck_goods_receipt_lots_expiry_after_mfg" CHECK ("manufacturing_date" IS NULL OR "expiry_date" > "manufacturing_date");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_lots" ADD CONSTRAINT "ck_inventory_item_lots_expiry_after_mfg" CHECK ("manufacturing_date" IS NULL OR "expiry_date" > "manufacturing_date");--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lots" ADD CONSTRAINT "ck_stock_adjustment_lots_expiry_after_mfg" CHECK ("manufacturing_date" IS NULL OR "expiry_date" > "manufacturing_date");