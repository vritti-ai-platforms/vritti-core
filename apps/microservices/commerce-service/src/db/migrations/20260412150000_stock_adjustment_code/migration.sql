-- Add code column
ALTER TABLE "vritti_core"."stock_adjustments" ADD COLUMN "code" varchar(50);--> statement-breakpoint

-- Backfill existing rows with generated codes
UPDATE "vritti_core"."stock_adjustments" sa
SET "code" = numbered.generated_code
FROM (
  SELECT id, 'SA-' || EXTRACT(YEAR FROM created_at)::text || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0') AS generated_code
  FROM "vritti_core"."stock_adjustments"
  WHERE "code" IS NULL
) numbered
WHERE sa.id = numbered.id;--> statement-breakpoint

-- Make column NOT NULL after backfill
ALTER TABLE "vritti_core"."stock_adjustments" ALTER COLUMN "code" SET NOT NULL;
