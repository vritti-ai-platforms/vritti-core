CREATE TABLE "vritti_core"."inventory_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"organization_id" uuid DEFAULT current_setting('app.org_id')::uuid NOT NULL,
	"business_unit_id" uuid DEFAULT current_setting('app.bu_id')::uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(50) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_inventory_locations_bu_code" UNIQUE("business_unit_id","code")
);
--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_locations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_levels" DROP CONSTRAINT IF EXISTS "uq_inventory_levels_item_bu";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_levels" ADD COLUMN IF NOT EXISTS "location_id" uuid;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inventory_locations_bu" ON "vritti_core"."inventory_locations" ("organization_id","business_unit_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_inventory_levels_location" ON "vritti_core"."inventory_levels" ("location_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_levels" DROP CONSTRAINT IF EXISTS "inventory_levels_location_id_inventory_locations_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_levels" ADD CONSTRAINT "inventory_levels_location_id_inventory_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vritti_core"."inventory_locations"("id") ON DELETE SET NULL;--> statement-breakpoint
CREATE POLICY "org_isolation" ON "vritti_core"."inventory_locations" AS PERMISSIVE FOR ALL TO public USING (organization_id = current_setting('app.org_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_ancestor_read" ON "vritti_core"."inventory_locations" AS PERMISSIVE FOR SELECT TO public USING (business_unit_id = ANY(current_setting('app.bu_ancestor_ids', true)::uuid[]));--> statement-breakpoint
CREATE POLICY "bu_write" ON "vritti_core"."inventory_locations" AS PERMISSIVE FOR INSERT TO public WITH CHECK (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_update" ON "vritti_core"."inventory_locations" AS PERMISSIVE FOR UPDATE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);--> statement-breakpoint
CREATE POLICY "bu_delete" ON "vritti_core"."inventory_locations" AS PERMISSIVE FOR DELETE TO public USING (business_unit_id = current_setting('app.bu_id', true)::uuid);