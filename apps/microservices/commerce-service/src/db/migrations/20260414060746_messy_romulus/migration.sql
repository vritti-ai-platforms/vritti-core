ALTER TABLE "vritti_core"."storage_locations" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "vritti_core"."storage_locations" ADD COLUMN "sort_order" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_storage_locations_parent" ON "vritti_core"."storage_locations" ("parent_id");