ALTER TABLE "vritti_core"."goods_receipt_lines"
  ADD COLUMN IF NOT EXISTS "inventory_item_id" uuid;

UPDATE "vritti_core"."goods_receipt_lines" grl
SET "inventory_item_id" = poi."inventory_item_id"
FROM "vritti_core"."purchase_order_items" poi
WHERE grl."purchase_order_item_id" = poi."id"
  AND grl."inventory_item_id" IS NULL;

UPDATE "vritti_core"."goods_receipt_lines" grl
SET "inventory_item_id" = src."inventory_item_id"
FROM (
  SELECT
    b."goods_receipt_line_id",
    (ARRAY_AGG(b."inventory_item_id") FILTER (WHERE b."inventory_item_id" IS NOT NULL))[1] AS "inventory_item_id"
  FROM "vritti_core"."goods_receipt_batches" b
  GROUP BY b."goods_receipt_line_id"
) src
WHERE src."goods_receipt_line_id" = grl."id"
  AND grl."inventory_item_id" IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'goods_receipt_lines_inventory_item_id_inventory_items_id_fk'
  ) THEN
    ALTER TABLE "vritti_core"."goods_receipt_lines"
      ADD CONSTRAINT "goods_receipt_lines_inventory_item_id_inventory_items_id_fk"
      FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_goods_receipt_lines_inventory"
  ON "vritti_core"."goods_receipt_lines" USING btree ("inventory_item_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "vritti_core"."goods_receipt_lines" WHERE "inventory_item_id" IS NULL
  ) THEN
    ALTER TABLE "vritti_core"."goods_receipt_lines"
      ALTER COLUMN "inventory_item_id" SET NOT NULL;
  ELSE
    RAISE NOTICE 'Skipping NOT NULL on goods_receipt_lines.inventory_item_id due to existing NULL rows. Clean data and re-apply.';
  END IF;
END $$;

ALTER TABLE "vritti_core"."goods_receipt_lines"
  DROP COLUMN IF EXISTS "purchase_order_item_id";

DROP INDEX IF EXISTS "vritti_core"."idx_goods_receipt_lines_po_item";
