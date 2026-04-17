-- Remove deprecated PRODUCTION value from stock_adjustment_type enum.
-- Safety: map any legacy rows to CORRECTION before type cast.

ALTER TYPE "vritti_core"."stock_adjustment_type" RENAME TO "stock_adjustment_type_old";

CREATE TYPE "vritti_core"."stock_adjustment_type" AS ENUM(
  'WASTE',
  'DAMAGE',
  'THEFT',
  'EXPIRED',
  'CORRECTION',
  'OPENING_STOCK'
);

UPDATE "vritti_core"."stock_adjustments"
SET "type" = 'CORRECTION'::"vritti_core"."stock_adjustment_type_old"
WHERE "type" = 'PRODUCTION'::"vritti_core"."stock_adjustment_type_old";

ALTER TABLE "vritti_core"."stock_adjustments"
  ALTER COLUMN "type" TYPE "vritti_core"."stock_adjustment_type"
  USING ("type"::text::"vritti_core"."stock_adjustment_type");

DROP TYPE "vritti_core"."stock_adjustment_type_old";
