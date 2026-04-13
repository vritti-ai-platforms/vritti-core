-- Create stock_adjustment_status enum
DO $$ BEGIN
  CREATE TYPE "vritti_core"."stock_adjustment_status" AS ENUM('DRAFT', 'PUBLISHED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Add status and published_at columns to stock_adjustments
ALTER TABLE "vritti_core"."stock_adjustments"
  ADD COLUMN "status" "vritti_core"."stock_adjustment_status" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "published_at" timestamp;--> statement-breakpoint

-- Set all existing rows as PUBLISHED (they were already committed)
UPDATE "vritti_core"."stock_adjustments"
  SET "status" = 'PUBLISHED', "published_at" = "created_at";--> statement-breakpoint

-- Create stock_adjustment_lines table
CREATE TABLE IF NOT EXISTS "vritti_core"."stock_adjustment_lines" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
  "business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
  "stock_adjustment_id" uuid NOT NULL,
  "batch_id" uuid,
  "location_id" uuid,
  "quantity" numeric(12, 3) NOT NULL,
  "batch_number" varchar(100),
  "manufacturing_date" date,
  "expiry_date" date,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

-- Add foreign keys
ALTER TABLE "vritti_core"."stock_adjustment_lines"
  ADD CONSTRAINT "stock_adjustment_lines_stock_adjustment_id_stock_adjustments_id_fk"
  FOREIGN KEY ("stock_adjustment_id") REFERENCES "vritti_core"."stock_adjustments"("id") ON DELETE cascade;--> statement-breakpoint

ALTER TABLE "vritti_core"."stock_adjustment_lines"
  ADD CONSTRAINT "stock_adjustment_lines_batch_id_inventory_item_batches_id_fk"
  FOREIGN KEY ("batch_id") REFERENCES "vritti_core"."inventory_item_batches"("id") ON DELETE set null;--> statement-breakpoint

ALTER TABLE "vritti_core"."stock_adjustment_lines"
  ADD CONSTRAINT "stock_adjustment_lines_location_id_storage_locations_id_fk"
  FOREIGN KEY ("location_id") REFERENCES "vritti_core"."storage_locations"("id");--> statement-breakpoint

-- Add indexes
CREATE INDEX IF NOT EXISTS "idx_stock_adjustment_lines_adjustment" ON "vritti_core"."stock_adjustment_lines" USING btree ("stock_adjustment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stock_adjustment_lines_batch" ON "vritti_core"."stock_adjustment_lines" USING btree ("batch_id");--> statement-breakpoint

-- Add index on stock_adjustments.status
CREATE INDEX IF NOT EXISTS "idx_stock_adjustments_status" ON "vritti_core"."stock_adjustments" USING btree ("status");--> statement-breakpoint

-- RLS policies for stock_adjustment_lines
ALTER TABLE "vritti_core"."stock_adjustment_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

CREATE POLICY "org_isolation" ON "vritti_core"."stock_adjustment_lines" FOR ALL USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."stock_adjustment_lines" FOR SELECT USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."stock_adjustment_lines" FOR INSERT WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."stock_adjustment_lines" FOR UPDATE USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."stock_adjustment_lines" FOR DELETE USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint

-- Migrate existing data: each stock_adjustment becomes one stock_adjustment_line
INSERT INTO "vritti_core"."stock_adjustment_lines" (
  "organization_id", "business_unit_id", "stock_adjustment_id",
  "batch_id", "location_id", "quantity"
)
SELECT
  "organization_id", "business_unit_id", "id",
  "batch_id", "location_id", "quantity"
FROM "vritti_core"."stock_adjustments"
WHERE "batch_id" IS NOT NULL OR "location_id" IS NOT NULL OR "quantity" IS NOT NULL;--> statement-breakpoint

-- Drop old columns from stock_adjustments
ALTER TABLE "vritti_core"."stock_adjustments" DROP COLUMN IF EXISTS "batch_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" DROP COLUMN IF EXISTS "location_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" DROP COLUMN IF EXISTS "quantity";--> statement-breakpoint

-- Drop old indexes that referenced removed columns
DROP INDEX IF EXISTS "vritti_core"."idx_stock_adjustments_batch";
