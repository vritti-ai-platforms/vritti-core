ALTER TYPE "vritti_core"."storage_location_role" RENAME TO "location_role";--> statement-breakpoint
ALTER TABLE "vritti_core"."storage_locations" RENAME TO "locations";--> statement-breakpoint
ALTER TABLE "vritti_core"."pos_terminals" RENAME COLUMN "storage_location_id" TO "location_id";--> statement-breakpoint
ALTER INDEX "vritti_core"."idx_storage_locations_bu" RENAME TO "idx_locations_bu";--> statement-breakpoint
ALTER INDEX "vritti_core"."idx_storage_locations_parent" RENAME TO "idx_locations_parent";--> statement-breakpoint
ALTER TABLE "vritti_core"."locations" RENAME CONSTRAINT "uq_storage_locations_bu_code" TO "uq_locations_bu_code";