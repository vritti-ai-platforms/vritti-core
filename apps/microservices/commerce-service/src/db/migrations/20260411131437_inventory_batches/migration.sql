-- Add OPENING_STOCK to inventory_ledger_type enum
ALTER TYPE "vritti_core"."inventory_ledger_type" ADD VALUE IF NOT EXISTS 'OPENING_STOCK';--> statement-breakpoint

-- Add OPENING_STOCK to stock_adjustment_type enum
ALTER TYPE "vritti_core"."stock_adjustment_type" ADD VALUE IF NOT EXISTS 'OPENING_STOCK';--> statement-breakpoint

-- Add reorder_level to inventory_items
ALTER TABLE "vritti_core"."inventory_items" ADD COLUMN IF NOT EXISTS "reorder_level" numeric(12,3) NOT NULL DEFAULT '0';--> statement-breakpoint

-- Create inventory_batches table
CREATE TABLE IF NOT EXISTS "vritti_core"."inventory_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"inventory_item_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"batch_number" varchar(100),
	"quantity" numeric(12,3) NOT NULL DEFAULT '0',
	"reserved_quantity" numeric(12,3) NOT NULL DEFAULT '0',
	"manufacturing_date" date,
	"expiry_date" date,
	"goods_receipt_item_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- Indexes for inventory_batches
CREATE INDEX IF NOT EXISTS "idx_inventory_batches_item" ON "vritti_core"."inventory_batches" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inventory_batches_location" ON "vritti_core"."inventory_batches" ("location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inventory_batches_item_location" ON "vritti_core"."inventory_batches" ("inventory_item_id","location_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inventory_batches_expiry" ON "vritti_core"."inventory_batches" ("expiry_date");--> statement-breakpoint

-- Foreign keys for inventory_batches
ALTER TABLE "vritti_core"."inventory_batches" ADD CONSTRAINT "inventory_batches_inventory_item_id_inventory_items_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_batches" ADD CONSTRAINT "inventory_batches_location_id_storage_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vritti_core"."storage_locations"("id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_batches" ADD CONSTRAINT "inventory_batches_goods_receipt_item_id_goods_receipt_items_id_fkey" FOREIGN KEY ("goods_receipt_item_id") REFERENCES "vritti_core"."goods_receipt_items"("id") ON DELETE SET NULL;--> statement-breakpoint

-- RLS policies for inventory_batches
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_batches" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_batches" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_batches" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_batches" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_batches" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint

-- Update inventory_ledger: remove balance_after, add batch_id
ALTER TABLE "vritti_core"."inventory_ledger" DROP COLUMN IF EXISTS "balance_after";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_ledger" ADD COLUMN IF NOT EXISTS "batch_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_ledger" ADD CONSTRAINT "inventory_ledger_batch_id_inventory_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "vritti_core"."inventory_batches"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inventory_ledger_batch" ON "vritti_core"."inventory_ledger" ("batch_id");--> statement-breakpoint

-- Update stock_adjustments: add batch_id and location_id
ALTER TABLE "vritti_core"."stock_adjustments" ADD COLUMN IF NOT EXISTS "batch_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" ADD COLUMN IF NOT EXISTS "location_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" ADD CONSTRAINT "stock_adjustments_batch_id_inventory_batches_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "vritti_core"."inventory_batches"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "vritti_core"."stock_adjustments" ADD CONSTRAINT "stock_adjustments_location_id_storage_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vritti_core"."storage_locations"("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_stock_adjustments_batch" ON "vritti_core"."stock_adjustments" ("batch_id");--> statement-breakpoint

-- Update goods_receipt_items: add batch fields
ALTER TABLE "vritti_core"."goods_receipt_items" ADD COLUMN IF NOT EXISTS "batch_number" varchar(100);--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ADD COLUMN IF NOT EXISTS "manufacturing_date" date;--> statement-breakpoint
ALTER TABLE "vritti_core"."goods_receipt_items" ADD COLUMN IF NOT EXISTS "expiry_date" date;--> statement-breakpoint

-- Drop old inventory_levels table and replace with view
DROP TABLE IF EXISTS "vritti_core"."inventory_levels" CASCADE;--> statement-breakpoint
CREATE VIEW "vritti_core"."inventory_levels" AS
  SELECT
    inventory_item_id,
    location_id,
    CAST(SUM(quantity) AS TEXT) AS stocked_quantity,
    CAST(SUM(reserved_quantity) AS TEXT) AS reserved_quantity,
    CAST(SUM(quantity - reserved_quantity) AS TEXT) AS available_quantity
  FROM "vritti_core"."inventory_batches"
  GROUP BY inventory_item_id, location_id;
