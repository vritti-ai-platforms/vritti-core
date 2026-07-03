ALTER TABLE "vritti_core"."business_units" ADD COLUMN "feature_locks" jsonb;--> statement-breakpoint
ALTER TABLE "vritti_core"."business_units" DROP COLUMN "feature_unlocks";