ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ADD COLUMN "numerator" integer;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ADD COLUMN "denominator" integer;--> statement-breakpoint
UPDATE "vritti_core"."inventory_item_uom_conversions"
SET numerator = 1, denominator = conversion_factor::integer
WHERE conversion_factor >= 1
  AND conversion_factor = floor(conversion_factor);--> statement-breakpoint
UPDATE "vritti_core"."inventory_item_uom_conversions"
SET numerator = ROUND(1.0 / conversion_factor)::integer, denominator = 1
WHERE conversion_factor < 1
  AND ABS((1.0 / conversion_factor) - ROUND(1.0 / conversion_factor)) < 1e-9;--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "vritti_core"."inventory_item_uom_conversions"
    WHERE numerator IS NULL OR denominator IS NULL
  ) THEN
    RAISE EXCEPTION 'Conversion rows with non-rational factors detected -- manual fix required before proceeding';
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ALTER COLUMN "numerator" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ALTER COLUMN "denominator" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" DROP COLUMN "conversion_factor";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ADD CONSTRAINT "chk_iiuc_num_positive" CHECK ("numerator" > 0);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_uom_conversions" ADD CONSTRAINT "chk_iiuc_denom_positive" CHECK ("denominator" > 0);
