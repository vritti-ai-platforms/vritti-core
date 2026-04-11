-- Drop reorder_level from inventory_items
ALTER TABLE "vritti_core"."inventory_items" DROP COLUMN IF EXISTS "reorder_level";--> statement-breakpoint

-- Create inventory_item_location_config table
CREATE TABLE "vritti_core"."inventory_item_location_config" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "organization_id" uuid NOT NULL DEFAULT current_setting('app.org_id')::uuid,
  "business_unit_id" uuid NOT NULL DEFAULT current_setting('app.bu_id')::uuid,
  "inventory_item_id" uuid NOT NULL REFERENCES "vritti_core"."inventory_items"("id") ON DELETE CASCADE,
  "location_id" uuid NOT NULL REFERENCES "vritti_core"."storage_locations"("id") ON DELETE CASCADE,
  "reorder_level" numeric(12,3) NOT NULL DEFAULT '0',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "uq_item_location_config" UNIQUE("inventory_item_id","location_id")
);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_item_location_config" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE INDEX "idx_item_location_config_item" ON "vritti_core"."inventory_item_location_config" ("inventory_item_id");--> statement-breakpoint
CREATE INDEX "idx_item_location_config_location" ON "vritti_core"."inventory_item_location_config" ("location_id");--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_item_location_config" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_item_location_config" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_item_location_config" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_item_location_config" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_item_location_config" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint

-- Recreate inventory_levels view with reorder_level from config
DROP VIEW IF EXISTS "vritti_core"."inventory_levels";--> statement-breakpoint
CREATE VIEW "vritti_core"."inventory_levels" AS
  SELECT
    b.inventory_item_id,
    b.location_id,
    CAST(SUM(b.quantity) AS TEXT) AS stocked_quantity,
    CAST(SUM(b.reserved_quantity) AS TEXT) AS reserved_quantity,
    CAST(SUM(b.quantity - b.reserved_quantity) AS TEXT) AS available_quantity,
    c.reorder_level
  FROM "vritti_core"."inventory_batches" b
  LEFT JOIN "vritti_core"."inventory_item_location_config" c
    ON b.inventory_item_id = c.inventory_item_id AND b.location_id = c.location_id
  GROUP BY b.inventory_item_id, b.location_id, c.reorder_level;
