ALTER TABLE "vritti_core"."goods_receipts"
  ADD COLUMN "supplier_id" uuid;

UPDATE "vritti_core"."goods_receipts" gr
SET "supplier_id" = po."supplier_id"
FROM "vritti_core"."purchase_orders" po
WHERE gr."purchase_order_id" = po."id";

ALTER TABLE "vritti_core"."goods_receipts"
  ALTER COLUMN "supplier_id" SET NOT NULL;

ALTER TABLE "vritti_core"."goods_receipts"
  ADD CONSTRAINT "goods_receipts_supplier_id_suppliers_id_fkey"
  FOREIGN KEY ("supplier_id")
  REFERENCES "vritti_core"."suppliers"("id");

ALTER TABLE "vritti_core"."goods_receipts"
  ALTER COLUMN "purchase_order_id" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_goods_receipts_supplier"
  ON "vritti_core"."goods_receipts" ("supplier_id");

ALTER TABLE "vritti_core"."goods_receipt_items"
  ADD COLUMN "inventory_item_id" uuid;

UPDATE "vritti_core"."goods_receipt_items" gri
SET "inventory_item_id" = poi."inventory_item_id"
FROM "vritti_core"."purchase_order_items" poi
WHERE gri."purchase_order_item_id" = poi."id";

ALTER TABLE "vritti_core"."goods_receipt_items"
  ALTER COLUMN "inventory_item_id" SET NOT NULL;

ALTER TABLE "vritti_core"."goods_receipt_items"
  ADD CONSTRAINT "goods_receipt_items_inventory_item_id_inventory_items_id_fkey"
  FOREIGN KEY ("inventory_item_id")
  REFERENCES "vritti_core"."inventory_items"("id");

ALTER TABLE "vritti_core"."goods_receipt_items"
  ALTER COLUMN "purchase_order_item_id" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "idx_goods_receipt_items_inventory"
  ON "vritti_core"."goods_receipt_items" ("inventory_item_id");
