-- Add uom_id to goods_receipt_items so the GR can represent multi-UOM receipts (e.g. "5 cases
-- + 12 loose pieces" of the same product) — mirrors purchase_order_items's (po_id, item_id, uom_id)
-- natural key.
--
-- Backfill: existing rows get the inventory item's primary UOM (inventory_items.uom_id).
-- After backfill, the column is set NOT NULL and the unique constraint is widened to include uom_id.

ALTER TABLE "vritti_core"."goods_receipt_items"
  ADD COLUMN "uom_id" uuid;

UPDATE "vritti_core"."goods_receipt_items" gri
SET "uom_id" = ii."uom_id"
FROM "vritti_core"."inventory_items" ii
WHERE gri."inventory_item_id" = ii."id"
  AND gri."uom_id" IS NULL;

ALTER TABLE "vritti_core"."goods_receipt_items"
  ALTER COLUMN "uom_id" SET NOT NULL;

ALTER TABLE "vritti_core"."goods_receipt_items"
  ADD CONSTRAINT "goods_receipt_items_uom_id_fk"
  FOREIGN KEY ("uom_id") REFERENCES "vritti_core"."uom" ("id");

ALTER TABLE "vritti_core"."goods_receipt_items"
  DROP CONSTRAINT "uq_goods_receipt_items_gr_item";

ALTER TABLE "vritti_core"."goods_receipt_items"
  ADD CONSTRAINT "uq_goods_receipt_items_gr_item_uom"
  UNIQUE ("goods_receipt_id", "inventory_item_id", "uom_id");

CREATE INDEX "idx_goods_receipt_items_uom" ON "vritti_core"."goods_receipt_items" ("uom_id");
