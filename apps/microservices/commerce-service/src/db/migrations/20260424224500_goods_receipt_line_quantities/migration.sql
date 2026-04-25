ALTER TABLE "vritti_core"."goods_receipt_lines"
  ADD COLUMN IF NOT EXISTS "accepted_quantity" numeric(12,3) DEFAULT '0' NOT NULL,
  ADD COLUMN IF NOT EXISTS "rejected_quantity" numeric(12,3) DEFAULT '0' NOT NULL;

UPDATE "vritti_core"."goods_receipt_lines" grl
SET
  "accepted_quantity" = COALESCE(src.accepted_sum, 0),
  "rejected_quantity" = COALESCE(src.rejected_sum, 0)
FROM (
  SELECT
    b."goods_receipt_line_id" AS line_id,
    SUM(b."accepted_quantity") AS accepted_sum,
    SUM(b."rejected_quantity") AS rejected_sum
  FROM "vritti_core"."goods_receipt_batches" b
  GROUP BY b."goods_receipt_line_id"
) src
WHERE src.line_id = grl."id";
