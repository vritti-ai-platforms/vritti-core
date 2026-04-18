DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'goods_receipt_status'
      AND n.nspname = 'vritti_core'
  ) THEN
    CREATE TYPE "vritti_core"."goods_receipt_status" AS ENUM('DRAFT', 'POSTED');
  END IF;
END $$;

ALTER TABLE "vritti_core"."goods_receipts"
  ADD COLUMN IF NOT EXISTS "status" "vritti_core"."goods_receipt_status" NOT NULL DEFAULT 'DRAFT';
