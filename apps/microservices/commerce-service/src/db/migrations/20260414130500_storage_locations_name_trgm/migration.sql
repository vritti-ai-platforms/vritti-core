CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_storage_locations_name_trgm"
ON "vritti_core"."storage_locations" USING gin ("name" gin_trgm_ops);

