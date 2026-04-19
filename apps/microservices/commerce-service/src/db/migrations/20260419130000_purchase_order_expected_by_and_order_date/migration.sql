DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'vritti_core'
      AND table_name = 'purchase_orders'
      AND column_name = 'expected_date'
  ) THEN
    EXECUTE 'ALTER TABLE "vritti_core"."purchase_orders" RENAME COLUMN "expected_date" TO "expected_by"';
  END IF;
END
$$;

DO $$
DECLARE
  order_date_type text;
BEGIN
  SELECT data_type INTO order_date_type
  FROM information_schema.columns
  WHERE table_schema = 'vritti_core'
    AND table_name = 'purchase_orders'
    AND column_name = 'order_date';

  IF order_date_type IS NOT NULL AND order_date_type <> 'date' THEN
    EXECUTE 'ALTER TABLE "vritti_core"."purchase_orders" ALTER COLUMN "order_date" TYPE date USING "order_date"::date';
  END IF;
END
$$;

DO $$
DECLARE
  expected_by_type text;
BEGIN
  SELECT data_type INTO expected_by_type
  FROM information_schema.columns
  WHERE table_schema = 'vritti_core'
    AND table_name = 'purchase_orders'
    AND column_name = 'expected_by';

  IF expected_by_type IS NOT NULL AND expected_by_type <> 'timestamp with time zone' THEN
    EXECUTE 'ALTER TABLE "vritti_core"."purchase_orders" ALTER COLUMN "expected_by" TYPE timestamp with time zone USING CASE WHEN "expected_by" IS NULL THEN NULL ELSE "expected_by"::timestamp with time zone END';
  END IF;
END
$$;
