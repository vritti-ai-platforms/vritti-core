DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'vritti_core'
      AND table_name = 'supplier_contacts'
      AND column_name = 'alternate_mobile'
  ) THEN
    ALTER TABLE "vritti_core"."supplier_contacts"
      RENAME COLUMN "alternate_mobile" TO "alternate_phone";
  END IF;
END $$;
