DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'tax_id_type'
      AND n.nspname = 'vritti_core'
  ) THEN
    EXECUTE 'CREATE TYPE "vritti_core"."tax_id_type" AS ENUM (''GST'', ''VAT'', ''EIN'', ''SALES_TAX'', ''OTHER'')';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'vritti_core'
      AND table_name = 'suppliers'
      AND column_name = 'tax_id_type'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."suppliers" ADD COLUMN "tax_id_type" "vritti_core"."tax_id_type"';
  END IF;
END
$$;
