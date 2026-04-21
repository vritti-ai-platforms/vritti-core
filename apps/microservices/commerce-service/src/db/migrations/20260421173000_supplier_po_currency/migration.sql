DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'vritti_core'
      AND table_name = 'suppliers'
      AND column_name = 'currency_code'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."suppliers" ADD COLUMN "currency_code" varchar(3)';
  END IF;
END
$$;

UPDATE "vritti_core"."suppliers"
SET "currency_code" = COALESCE("currency_code", 'INR')
WHERE "currency_code" IS NULL;

ALTER TABLE "vritti_core"."suppliers"
  ALTER COLUMN "currency_code" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'vritti_core'
      AND table_name = 'purchase_orders'
      AND column_name = 'currency_code'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."purchase_orders" ADD COLUMN "currency_code" varchar(3)';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'vritti_core'
      AND table_name = 'purchase_orders'
      AND column_name = 'conversion_rate'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."purchase_orders" ADD COLUMN "conversion_rate" decimal(18,6)';
  END IF;
END
$$;

UPDATE "vritti_core"."purchase_orders"
SET
  "currency_code" = COALESCE("currency_code", 'INR'),
  "conversion_rate" = COALESCE("conversion_rate", 1)
WHERE "currency_code" IS NULL OR "conversion_rate" IS NULL;

ALTER TABLE "vritti_core"."purchase_orders"
  ALTER COLUMN "currency_code" SET NOT NULL,
  ALTER COLUMN "conversion_rate" SET DEFAULT 1,
  ALTER COLUMN "conversion_rate" SET NOT NULL;
