DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'vritti_core'
      AND table_name = 'suppliers'
      AND column_name = 'gstin'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'vritti_core'
      AND table_name = 'suppliers'
      AND column_name = 'tax_id'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."suppliers" RENAME COLUMN "gstin" TO "tax_id"';
  END IF;
END
$$;
