-- 1) Add column with a placeholder default so existing NOT NULL rows can be added
ALTER TABLE "vritti_core"."stock_adjustment_lines"
  ADD COLUMN "conversion_factor" numeric(20,6) DEFAULT '1' NOT NULL;--> statement-breakpoint

-- 2) Backfill from per-item overrides (preferred) → global UOM factor → fallback 1
UPDATE "vritti_core"."stock_adjustment_lines" l
SET "conversion_factor" = COALESCE(
  (SELECT (iuc.denominator::decimal / iuc.numerator::decimal)
     FROM "vritti_core"."inventory_item_uom_conversions" iuc
     WHERE iuc.inventory_item_id = a.inventory_item_id AND iuc.uom_id = l.uom_id
     LIMIT 1),
  (SELECT u.conversion_factor FROM "vritti_core"."uom" u WHERE u.id = l.uom_id),
  1
)
FROM "vritti_core"."stock_adjustments" a
WHERE l.stock_adjustment_id = a.id;
