-- Rename UOM conversion fields to a clearer (primary_qty, uom_qty) pair across two tables.
--
-- inventory_item_uom_conversions:
--   numerator           → primary_qty
--   denominator         → uom_qty
--   check constraints renamed
--
-- uom:
--   conversion_factor (doublePrecision FLOAT, single value) → (primary_qty, uom_qty) integer pair.
--   Backfill rule: integer factor ≥ 1 maps to (factor, 1); fractional factor < 1 maps to (1, round(1/factor)).
--   The old float column is then dropped.

-- ===== inventory_item_uom_conversions =====
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" RENAME COLUMN "numerator" TO "primary_qty";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" RENAME COLUMN "denominator" TO "uom_qty";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" DROP CONSTRAINT IF EXISTS "chk_iiuc_num_positive";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" DROP CONSTRAINT IF EXISTS "chk_iiuc_denom_positive";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ADD CONSTRAINT "chk_iiuc_primary_qty_positive" CHECK (primary_qty > 0);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ADD CONSTRAINT "chk_iiuc_uom_qty_positive" CHECK (uom_qty > 0);--> statement-breakpoint

-- ===== uom =====
ALTER TABLE "vritti_core"."uom" ADD COLUMN "primary_qty" integer;--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" ADD COLUMN "uom_qty" integer;--> statement-breakpoint

-- Backfill from existing float conversion_factor.
-- Factor ≥ 1 (e.g. Box=12 → 12 base units): primary_qty = ROUND(factor), uom_qty = 1.
-- Factor < 1  (e.g. Gram=0.001 Kg):           primary_qty = 1, uom_qty = ROUND(1/factor).
-- NULL/zero factors fall back to (1, 1).
UPDATE "vritti_core"."uom"
SET
  primary_qty = CASE
    WHEN conversion_factor IS NULL OR conversion_factor = 0 THEN 1
    WHEN conversion_factor >= 1 THEN GREATEST(ROUND(conversion_factor)::integer, 1)
    ELSE 1
  END,
  uom_qty = CASE
    WHEN conversion_factor IS NULL OR conversion_factor = 0 THEN 1
    WHEN conversion_factor >= 1 THEN 1
    ELSE GREATEST(ROUND(1 / conversion_factor)::integer, 1)
  END;--> statement-breakpoint

ALTER TABLE "vritti_core"."uom" ALTER COLUMN "primary_qty" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" ALTER COLUMN "uom_qty" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" ALTER COLUMN "primary_qty" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" ALTER COLUMN "uom_qty" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" ADD CONSTRAINT "chk_uom_primary_qty_positive" CHECK (primary_qty > 0);--> statement-breakpoint
ALTER TABLE "vritti_core"."uom" ADD CONSTRAINT "chk_uom_uom_qty_positive" CHECK (uom_qty > 0);--> statement-breakpoint

ALTER TABLE "vritti_core"."uom" DROP COLUMN "conversion_factor";
