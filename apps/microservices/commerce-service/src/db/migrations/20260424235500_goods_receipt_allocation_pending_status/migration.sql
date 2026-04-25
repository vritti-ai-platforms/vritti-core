DO $$
BEGIN
  ALTER TYPE "vritti_core"."goods_receipt_status"
    ADD VALUE IF NOT EXISTS 'ALLOCATION_PENDING' BEFORE 'PUBLISHED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
