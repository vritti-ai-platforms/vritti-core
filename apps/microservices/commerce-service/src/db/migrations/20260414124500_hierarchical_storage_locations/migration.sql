ALTER TABLE "vritti_core"."storage_locations" ADD COLUMN IF NOT EXISTS "parent_id" uuid;
--> statement-breakpoint
ALTER TABLE "vritti_core"."storage_locations" ADD COLUMN IF NOT EXISTS "sort_order" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_storage_locations_parent" ON "vritti_core"."storage_locations" ("parent_id");
