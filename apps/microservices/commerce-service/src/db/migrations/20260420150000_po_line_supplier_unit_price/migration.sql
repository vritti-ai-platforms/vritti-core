DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'vritti_core'
      AND table_name = 'purchase_order_items'
      AND column_name = 'supplier_unit_price'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."purchase_order_items" ADD COLUMN "supplier_unit_price" decimal(12,2)';
  END IF;
END
$$;

UPDATE "vritti_core"."purchase_order_items"
SET "supplier_unit_price" = COALESCE("supplier_unit_price", "unit_price", 0)
WHERE "supplier_unit_price" IS NULL;

ALTER TABLE "vritti_core"."purchase_order_items"
  ALTER COLUMN "supplier_unit_price" SET NOT NULL;
