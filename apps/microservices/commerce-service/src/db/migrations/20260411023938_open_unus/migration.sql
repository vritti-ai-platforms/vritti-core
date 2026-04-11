DROP INDEX IF EXISTS "uq_inventory_levels_item_bu_loc";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_inventory_levels_bu";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_locations" ADD COLUMN "area" varchar(100);--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_locations" ADD COLUMN "manager_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_locations" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_levels" DROP COLUMN IF EXISTS "business_unit_id";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_levels" ALTER COLUMN "location_id" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "uq_inventory_levels_item_location" ON "vritti_core"."inventory_levels" ("inventory_item_id","location_id");--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_levels" DROP CONSTRAINT IF EXISTS "inventory_levels_location_id_inventory_locations_id_fkey";--> statement-breakpoint
ALTER TABLE "vritti_core"."inventory_levels" ADD CONSTRAINT "inventory_levels_location_id_inventory_locations_id_fkey" FOREIGN KEY ("location_id") REFERENCES "vritti_core"."inventory_locations"("id");