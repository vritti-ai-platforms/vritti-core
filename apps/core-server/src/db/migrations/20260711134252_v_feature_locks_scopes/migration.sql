ALTER TABLE "vritti_core"."organizations" ADD COLUMN "feature_locks" jsonb;--> statement-breakpoint
ALTER TABLE "vritti_core"."legal_entities" ADD COLUMN "feature_locks" jsonb;--> statement-breakpoint
ALTER TABLE "vritti_core"."site_groups" ADD COLUMN "feature_locks" jsonb;