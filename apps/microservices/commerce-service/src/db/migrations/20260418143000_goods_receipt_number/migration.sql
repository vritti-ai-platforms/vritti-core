DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND c.relname = 'goods_receipt_number_seq'
      AND n.nspname = 'vritti_core'
  ) THEN
    CREATE SEQUENCE "vritti_core"."goods_receipt_number_seq";
  END IF;
END $$;

ALTER TABLE "vritti_core"."goods_receipts"
  ADD COLUMN IF NOT EXISTS "gr_number" varchar(50);

UPDATE "vritti_core"."goods_receipts"
SET "gr_number" = CONCAT(
  'GR-',
  to_char(current_date, 'YYYYMM'),
  '-',
  lpad(nextval('"vritti_core"."goods_receipt_number_seq"')::text, 4, '0')
)
WHERE "gr_number" IS NULL;

ALTER TABLE "vritti_core"."goods_receipts"
  ALTER COLUMN "gr_number" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.conname = 'uq_goods_receipts_bu_gr_number'
      AND n.nspname = 'vritti_core'
  ) THEN
    ALTER TABLE "vritti_core"."goods_receipts"
      ADD CONSTRAINT "uq_goods_receipts_bu_gr_number" UNIQUE ("business_unit_id", "gr_number");
  END IF;
END $$;
