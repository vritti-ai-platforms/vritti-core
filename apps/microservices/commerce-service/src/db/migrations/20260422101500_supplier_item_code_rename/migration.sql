DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'vritti_core'
      AND table_name = 'supplier_items'
      AND column_name = 'supplier_code'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'vritti_core'
      AND table_name = 'supplier_items'
      AND column_name = 'supplier_item_code'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."supplier_items" RENAME COLUMN "supplier_code" TO "supplier_item_code"';
  END IF;
END
$$;
