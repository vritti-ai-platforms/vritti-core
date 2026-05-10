-- 1) Add as nullable so existing rows can be backfilled
ALTER TABLE "vritti_core"."stock_adjustment_lines" ADD COLUMN "uom_id" uuid;--> statement-breakpoint

-- 2) Backfill from the parent inventory item's primary UOM
UPDATE "vritti_core"."stock_adjustment_lines" l
SET "uom_id" = i."uom_id"
FROM "vritti_core"."stock_adjustments" a
JOIN "vritti_core"."inventory_items" i ON i."id" = a."inventory_item_id"
WHERE l."stock_adjustment_id" = a."id" AND l."uom_id" IS NULL;--> statement-breakpoint

-- 3) Enforce NOT NULL once every row has a value
ALTER TABLE "vritti_core"."stock_adjustment_lines" ALTER COLUMN "uom_id" SET NOT NULL;--> statement-breakpoint

CREATE INDEX "idx_stock_adjustment_lines_uom" ON "vritti_core"."stock_adjustment_lines" ("uom_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustment_lines" ADD CONSTRAINT "stock_adjustment_lines_uom_id_uom_id_fkey" FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom"("id");
