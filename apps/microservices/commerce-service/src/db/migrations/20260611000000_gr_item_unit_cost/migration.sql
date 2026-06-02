-- Effective per-unit landed cost on goods_receipt_items: unit_price × ordered_qty / total_qty,
-- in the item's UOM and supplier currency (diluted by free units). Backfilled from existing rows.
ALTER TABLE "vritti_core"."goods_receipt_items" ADD COLUMN "unit_cost" bigint;--> statement-breakpoint

UPDATE "vritti_core"."goods_receipt_items"
  SET "unit_cost" = ROUND("unit_price"::numeric * "ordered_qty" / NULLIF("total_qty", 0))::bigint
  WHERE "unit_price" IS NOT NULL AND "total_qty" > 0;
